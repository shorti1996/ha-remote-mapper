"""In-process scenes.yaml management (mirrors materializer.py).

Same pattern as the automation config store: yaml upsert/delete by id,
atomic write, scene.reload (untargeted — scenes have no targeted
reload), asyncio.Lock. Registry platform for UI scenes is
("scene", "homeassistant", <config id>).
"""

from __future__ import annotations

import asyncio
import logging
import shutil
from pathlib import Path
from typing import TYPE_CHECKING, Any

from homeassistant.components.scene import PLATFORM_SCHEMA as SCENE_PLATFORM_SCHEMA
from homeassistant.config import SCENE_CONFIG_PATH
from homeassistant.const import CONF_ID, SERVICE_RELOAD
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util.file import write_utf8_file_atomic
from homeassistant.util.yaml import dump, load_yaml

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

SCENE_DOMAIN = "scene"
HOMEASSISTANT_PLATFORM = "homeassistant"


class SceneConfigStore:
    """Serialized in-process reads/writes of scenes.yaml."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize."""
        self.hass = hass
        self._lock = asyncio.Lock()
        self._path = hass.config.path(SCENE_CONFIG_PATH)

    def _read_sync(self) -> list[dict[str, Any]]:
        try:
            data = load_yaml(self._path)
        except FileNotFoundError:
            return []
        # load_yaml returns {} for an empty file
        if data is None or data == {}:
            return []
        if not isinstance(data, list):
            # NEVER coerce unexpected content to [] — a later write would
            # destroy the user's scenes. Refuse to touch the file.
            raise HomeAssistantError(
                f"{self._path} does not contain a list — refusing to modify it"
            )
        return data

    def _write_sync(self, data: list[dict[str, Any]]) -> None:
        # Last-known-good sidecar (see materializer._write_sync)
        try:
            existing = Path(self._path)
            if existing.is_file() and existing.stat().st_size > 3:
                shutil.copyfile(self._path, f"{self._path}.remote_mapper_backup")
        except OSError:
            _LOGGER.warning("Could not write backup for %s", self._path)
        write_utf8_file_atomic(self._path, dump(data))

    async def async_get(self, config_id: str) -> dict[str, Any] | None:
        """Read one scene config by id."""
        async with self._lock:
            data = await self.hass.async_add_executor_job(self._read_sync)
        for item in data:
            if item.get(CONF_ID) == config_id:
                return dict(item)
        return None

    async def async_upsert(self, config_id: str, payload: dict[str, Any]) -> None:
        """Validate, upsert by id (foreign entries untouched), reload."""
        SCENE_PLATFORM_SCHEMA(dict(payload))
        new_value = {CONF_ID: config_id, **payload}
        async with self._lock:
            data = await self.hass.async_add_executor_job(self._read_sync)
            for index, item in enumerate(data):
                if item.get(CONF_ID) == config_id:
                    data[index] = new_value
                    break
            else:
                data.append(new_value)
            await self.hass.async_add_executor_job(self._write_sync, data)
        await self.hass.services.async_call(SCENE_DOMAIN, SERVICE_RELOAD, blocking=True)

    async def async_delete(self, config_id: str) -> bool:
        """Remove entry from yaml + drop the registry entity."""
        removed = False
        async with self._lock:
            data = await self.hass.async_add_executor_job(self._read_sync)
            filtered = [item for item in data if item.get(CONF_ID) != config_id]
            if len(filtered) != len(data):
                removed = True
                await self.hass.async_add_executor_job(self._write_sync, filtered)
        registry = er.async_get(self.hass)
        if entity_id := registry.async_get_entity_id(
            SCENE_DOMAIN, HOMEASSISTANT_PLATFORM, config_id
        ):
            registry.async_remove(entity_id)
        return removed


def get_scene_config_store(hass: HomeAssistant) -> SceneConfigStore:
    """Shared instance."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if "scene_config_store" not in domain_data:
        domain_data["scene_config_store"] = SceneConfigStore(hass)
    return domain_data["scene_config_store"]


def scene_entity_id(hass: HomeAssistant, config_id: str) -> str | None:
    """Map scene config id → entity id."""
    return er.async_get(hass).async_get_entity_id(
        SCENE_DOMAIN, HOMEASSISTANT_PLATFORM, config_id
    )

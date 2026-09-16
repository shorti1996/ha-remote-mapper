"""In-process automations.yaml management (materialization).

Replicates what the native editor's admin-only HTTP view does
(config/view.py + config/automation.py) because backend code cannot call
those views: load yaml → upsert/delete by id → atomic write → targeted
automation.reload. One asyncio.Lock serializes our writes; the small race
window against simultaneous UI edits is accepted (plan §8.2).

Mode switch, not one-shot export: while materialized the automation is
canonical — the slot store keeps only a pointer.
"""

from __future__ import annotations

import asyncio
import logging
import shutil
from pathlib import Path
from typing import TYPE_CHECKING, Any

from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA
from homeassistant.components.automation.config import async_validate_config_item
from homeassistant.config import AUTOMATION_CONFIG_PATH
from homeassistant.const import CONF_ID, SERVICE_RELOAD
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util.file import write_utf8_file_atomic
from homeassistant.util.yaml import dump, load_yaml

from .const import AUTOMATION_ALIAS_PREFIX, DOMAIN, MANAGED_DESCRIPTION_MARKER

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)

AUTOMATION_DOMAIN = "automation"
EDIT_URL = "/config/automation/edit/{}"


def automation_config_id(entry_id: str, action_id: str) -> str:
    """Deterministic automation id for a slot — idempotent re-materialize."""
    return f"{DOMAIN}_{entry_id}_{action_id}"


def build_payload(
    remote_title: str,
    action_id: str,
    trigger: dict[str, Any],
    sequence: list[Any],
    name: str | None = None,
) -> dict[str, Any]:
    """Automation payload — plural keys (2024.10+ editor convention).

    The user's slot name (if any) goes into the alias so the automation
    reads well in HA's own list.
    """
    alias = f"{AUTOMATION_ALIAS_PREFIX} {remote_title} · {action_id}"
    if name:
        alias = f"{alias} — {name}"
    return {
        "alias": alias,
        "description": (
            f"{MANAGED_DESCRIPTION_MARKER} Edits here are canonical. "
            "Disable the toggle in the remote card to remove."
        ),
        "triggers": [trigger],
        "conditions": [],
        "actions": sequence,
        "mode": "single",
    }


class AutomationConfigStore:
    """Serialized in-process reads/writes of automations.yaml."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize."""
        self.hass = hass
        self._lock = asyncio.Lock()
        self._path = hass.config.path(AUTOMATION_CONFIG_PATH)

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
            # destroy the user's automations. Refuse to touch the file.
            raise HomeAssistantError(
                f"{self._path} does not contain a list — refusing to modify it"
            )
        return data

    def _write_sync(self, data: list[dict[str, Any]]) -> None:
        # Last-known-good sidecar: one pre-write copy, cheap insurance
        # against read/serialize bugs eating hand-written config.
        try:
            existing = Path(self._path)
            if existing.is_file() and existing.stat().st_size > 3:
                shutil.copyfile(self._path, f"{self._path}.remote_mapper_backup")
        except OSError:
            _LOGGER.warning("Could not write backup for %s", self._path)
        write_utf8_file_atomic(self._path, dump(data))

    async def async_get(self, config_id: str) -> dict[str, Any] | None:
        """Live entity raw_config preferred; file fallback."""
        if (component := self.hass.data.get(AUTOMATION_DATA)) is not None:
            for entity in component.entities:
                if entity.unique_id == config_id and entity.raw_config is not None:
                    return dict(entity.raw_config)
        async with self._lock:
            data = await self.hass.async_add_executor_job(self._read_sync)
        for item in data:
            if item.get(CONF_ID) == config_id:
                return dict(item)
        return None

    async def async_upsert(self, config_id: str, payload: dict[str, Any]) -> None:
        """Validate, upsert by id (foreign entries untouched), reload."""
        await async_validate_config_item(self.hass, config_id, dict(payload))
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
        # Targeted reload — same as the view's post_write_hook
        await self.hass.services.async_call(
            AUTOMATION_DOMAIN, SERVICE_RELOAD, {CONF_ID: config_id}, blocking=True
        )

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
            AUTOMATION_DOMAIN, AUTOMATION_DOMAIN, config_id
        ):
            registry.async_remove(entity_id)
        return removed


def _get_config_store(hass: HomeAssistant) -> AutomationConfigStore:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if "automation_config_store" not in domain_data:
        domain_data["automation_config_store"] = AutomationConfigStore(hass)
    return domain_data["automation_config_store"]


def automation_entity_id(hass: HomeAssistant, config_id: str) -> str | None:
    """Map config id → entity id (deep-links use config id, services entity id)."""
    return er.async_get(hass).async_get_entity_id(
        AUTOMATION_DOMAIN, AUTOMATION_DOMAIN, config_id
    )


async def async_materialize(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    title: str,
) -> str:
    """Create/update the slot's automation; returns the config id."""
    from .adapters import get_adapter

    remote = store.get_remote(entry_id)
    slot = store.get_slot(entry_id, action_id)
    if remote is None or slot is None:
        raise HomeAssistantError(f"No slot {entry_id}/{action_id} to materialize")

    adapter = get_adapter(remote["source"])
    trigger = adapter.build_trigger(action_id, remote["source_config"])
    config_id = automation_config_id(entry_id, action_id)
    payload = build_payload(
        title, action_id, trigger, slot["sequence"], slot.get("name")
    )

    await _get_config_store(hass).async_upsert(config_id, payload)

    slot["materialized"] = True
    slot["automation_id"] = config_id
    slot["owned"] = True
    store.async_set_slot(entry_id, action_id, slot)
    return config_id


def is_linked(slot: dict[str, Any] | None) -> bool:
    """Materialized onto a native automation we did not create."""
    return bool(
        slot and slot.get("materialized") and slot.get("automation_id")
    ) and not slot.get("owned", True)


async def async_link(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    config_id: str,
) -> None:
    """Point the slot at an existing native automation (link mode).

    Nothing is copied or disabled: the automation stays canonical and
    keeps firing on its own trigger; the dispatcher skips the slot.
    """
    from .store import default_slot

    if await _get_config_store(hass).async_get(config_id) is None:
        raise HomeAssistantError(f"Automation {config_id} not found")
    slot = store.get_slot(entry_id, action_id) or default_slot()
    slot["materialized"] = True
    slot["automation_id"] = config_id
    slot["owned"] = False
    slot["sequence"] = []
    slot["scene_id"] = None
    slot["shared_automation"] = False
    # imported_from is kept on purpose: the originals' chips stay visible
    store.async_set_slot(entry_id, action_id, slot)


async def async_absorb_link(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
) -> None:
    """Unlink: copy the automation's actions into the slot, disable it.

    Same footprint as an absorbing import — the original is disabled
    (never deleted) and remembered in imported_from for hand-back.
    """
    slot = store.get_slot(entry_id, action_id)
    if not is_linked(slot):
        raise HomeAssistantError(f"Slot {entry_id}/{action_id} is not linked")
    config_id = slot["automation_id"]
    raw = await _get_config_store(hass).async_get(config_id)
    if raw is None:
        raise HomeAssistantError(f"Automation {config_id} no longer exists")
    entity_id = automation_entity_id(hass, config_id)
    slot["sequence"] = list(raw.get("actions", raw.get("action", [])) or [])
    slot["materialized"] = False
    slot["automation_id"] = None
    slot["owned"] = True
    slot["imported_from"] = {
        "entity_id": entity_id,
        "config_id": config_id,
        "sources": [{"entity_id": entity_id, "config_id": config_id}],
    }
    store.async_set_slot(entry_id, action_id, slot)
    if entity_id:
        await hass.services.async_call(
            AUTOMATION_DOMAIN, "turn_off", {"entity_id": entity_id}, blocking=True
        )


async def async_unmanage(hass: HomeAssistant, config_id: str, alias: str) -> bool:
    """Turn a managed automation into a plain one (release flow).

    Keeps triggers/actions; replaces our prefixed alias and strips the
    auto-managed description. False if the automation no longer exists.
    """
    store = _get_config_store(hass)
    raw = await store.async_get(config_id)
    if raw is None:
        return False
    payload = {k: v for k, v in raw.items() if k != "id"}
    payload["alias"] = alias
    description = str(payload.get("description", ""))
    if MANAGED_DESCRIPTION_MARKER in description:
        payload["description"] = ""
    await store.async_upsert(config_id, payload)
    return True


async def async_get_live_view(
    hass: HomeAssistant, slot: dict[str, Any], action_id: str | None = None
) -> dict[str, Any] | None:
    """Summary of the materialized automation for the card.

    With ``action_id``, a single-choose automation keyed on trigger ids
    (the remote's shared automation, or an imported "Shape A" one) is
    narrowed to this event's branch.
    """
    from .remote_automation import branch_view

    config_id = slot.get("automation_id")
    if not config_id:
        return None
    raw = await _get_config_store(hass).async_get(config_id)
    if raw is None:
        return None
    entity_id = automation_entity_id(hass, config_id)
    state = hass.states.get(entity_id) if entity_id else None
    view = {
        "config_id": config_id,
        "entity_id": entity_id,
        "alias": raw.get("alias"),
        "actions": raw.get("actions", raw.get("action", [])),
        "edit_url": EDIT_URL.format(config_id),
        "owned": slot.get("owned", True),
        "state": state.state if state else None,
        "branch": False,
        "branch_missing": False,
    }
    if action_id is not None and (branch := branch_view(raw, action_id)) is not None:
        view["actions"] = branch["actions"]
        view["branch"] = True
        view["branch_missing"] = branch["branch_missing"]
    return view


async def async_dematerialize(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    sequence: list[Any] | None,
    delete_automation: bool = True,
) -> None:
    """Fold the automation back into the store.

    sequence=None pulls the automation's current actions (the external
    edits are canonical). M5 wires delete_automation to the
    owned_scene_cleanup policy; disabled-not-deleted keeps the automation
    but drops our pointer.
    """
    slot = store.get_slot(entry_id, action_id)
    if slot is None:
        raise HomeAssistantError(f"No slot {entry_id}/{action_id}")
    config_id = slot.get("automation_id")

    if sequence is None:
        sequence = []
        if config_id and (raw := await _get_config_store(hass).async_get(config_id)):
            actions = raw.get("actions", raw.get("action", []))
            sequence = actions if isinstance(actions, list) else [actions]

    if config_id:
        if delete_automation:
            await _get_config_store(hass).async_delete(config_id)
        elif entity_id := automation_entity_id(hass, config_id):
            await hass.services.async_call(
                AUTOMATION_DOMAIN, "turn_off", {"entity_id": entity_id}, blocking=True
            )

    slot["sequence"] = sequence
    slot["materialized"] = False
    slot["automation_id"] = None
    store.async_set_slot(entry_id, action_id, slot)


async def async_check_orphans(
    hass: HomeAssistant, store: RemoteMapperStore, entry_id: str
) -> list[str]:
    """Reset slots whose automation vanished (deleted behind our back)."""
    remote = store.get_remote(entry_id)
    if remote is None:
        return []
    orphaned: list[str] = []
    for action_id, slot in remote.get("slots", {}).items():
        if not slot.get("materialized"):
            continue
        config_id = slot.get("automation_id")
        if config_id and await _get_config_store(hass).async_get(config_id):
            continue
        slot["materialized"] = False
        slot["automation_id"] = None
        store.async_set_slot(entry_id, action_id, slot)
        orphaned.append(action_id)
    if orphaned:
        _LOGGER.warning(
            "Remote %s: automations for %s vanished — slots reset to card-only",
            entry_id,
            orphaned,
        )
    return orphaned

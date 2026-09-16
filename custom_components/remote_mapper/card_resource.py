# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Lovelace resource registration for the card bundle in www/ (edm pattern).

Lives at the package root on purpose: frontend/ holds only the TypeScript
sources and is excluded from the HACS release zip (scripts/package.sh).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.const import LOVELACE_DATA

from .const import JSMODULES, URL_BASE

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

# Compiled JS lives in www/ next to this module.
_WWW_DIR = Path(__file__).parent / "www"


class JSModuleRegistration:
    """Registers JavaScript modules as Lovelace resources."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize."""
        self.hass = hass
        self.lovelace = hass.data.get(LOVELACE_DATA)

    async def async_register(self) -> None:
        """Register static path and Lovelace resources (storage mode only)."""
        await self._async_register_static_path()
        if self.lovelace and self.lovelace.resource_mode == "storage":
            await self._async_load_resources()
            await self._async_register_modules()

    async def _async_register_static_path(self) -> None:
        """Serve www/ at URL_BASE."""
        try:
            await self.hass.http.async_register_static_paths(
                [StaticPathConfig(URL_BASE, str(_WWW_DIR), False)]
            )
            _LOGGER.debug("Registered static path: %s", URL_BASE)
        except RuntimeError:
            _LOGGER.debug("Static path already registered: %s", URL_BASE)

    async def _async_load_resources(self) -> None:
        """Force-load the resource collection (lovelace loads it lazily)."""
        if not self.lovelace.resources.loaded:
            await self.lovelace.resources.async_load()
            self.lovelace.resources.loaded = True

    async def _async_register_modules(self) -> None:
        """Add or update JS modules in Lovelace resources."""
        existing = list(self.lovelace.resources.async_items())

        for module in JSMODULES:
            url = f"{URL_BASE}/{module['filename']}"
            versioned_url = f"{url}?v={module['version']}"
            registered = False

            for resource in existing:
                if self._strip_query(resource["url"]) == url:
                    registered = True
                    if self._extract_version(resource["url"]) != module["version"]:
                        _LOGGER.info(
                            "Updating %s to version %s",
                            module["name"],
                            module["version"],
                        )
                        await self.lovelace.resources.async_update_item(
                            resource["id"],
                            {"res_type": "module", "url": versioned_url},
                        )
                    break

            if not registered:
                _LOGGER.info(
                    "Registering new Lovelace resource: %s v%s",
                    module["name"],
                    module["version"],
                )
                await self.lovelace.resources.async_create_item(
                    {"res_type": "module", "url": versioned_url}
                )

    async def async_unregister(self) -> None:
        """Remove this integration's Lovelace resources (uninstall cleanup)."""
        if not self.lovelace or self.lovelace.resource_mode != "storage":
            return
        for module in JSMODULES:
            url_prefix = f"{URL_BASE}/{module['filename']}"
            for resource in self.lovelace.resources.async_items():
                if resource["url"].startswith(url_prefix):
                    await self.lovelace.resources.async_delete_item(resource["id"])

    @staticmethod
    def _strip_query(url: str) -> str:
        return url.split("?")[0]

    @staticmethod
    def _extract_version(url: str) -> str:
        parts = url.split("?v=")
        return parts[1] if len(parts) > 1 else "0"

"""Remote Mapper — physical remotes as first-class dashboard objects."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState

from .const import DOMAIN
from .frontend import JSModuleRegistration
from .websocket import async_register_websocket_commands

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: Any) -> bool:
    """Register WS commands and frontend once per boot.

    Per-remote work (store load, device attach, adapter subscribe) lives in
    async_setup_entry.
    """
    hass.data.setdefault(DOMAIN, {})

    async_register_websocket_commands(hass)

    async def _register_frontend(_event: Any = None) -> None:
        registrar = JSModuleRegistration(hass)
        await registrar.async_register()
        hass.data[DOMAIN]["frontend_registrar"] = registrar

    if hass.state is CoreState.running:
        await _register_frontend()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register_frontend)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up one remote.

    M0 placeholder — M1 adds store load, device registry attach, and the
    device_trigger adapter subscription.
    """
    hass.data[DOMAIN][entry.entry_id] = {}
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload one remote."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True

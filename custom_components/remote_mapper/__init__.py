"""Remote Mapper — physical remotes as first-class dashboard objects."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState
from homeassistant.exceptions import ConfigEntryNotReady, HomeAssistantError
from homeassistant.helpers import device_registry as dr

from .adapters import get_adapter
from .const import (
    CONF_ACTIONS,
    CONF_DEVICE_ID,
    CONF_LAYOUT,
    CONF_SOURCE,
    CONF_SOURCE_CONFIG,
    DOMAIN,
)
from .dispatcher import SlotDispatcher
from .frontend import JSModuleRegistration
from .store import RemoteMapperStore
from .websocket import async_register_websocket_commands

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: Any) -> bool:
    """Register store, WS commands, and frontend once per boot.

    Per-remote work (device attach, adapter subscribe) lives in
    async_setup_entry.
    """
    store = RemoteMapperStore(hass)
    await store.async_load()
    hass.data.setdefault(DOMAIN, {})["store"] = store

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
    """Set up one remote: store record, device attach, adapter subscribe."""
    store: RemoteMapperStore = hass.data[DOMAIN]["store"]

    source = entry.data.get(CONF_SOURCE)
    if source is None:
        # Pre-M1 placeholder entry — loads inert, nothing to subscribe.
        hass.data[DOMAIN][entry.entry_id] = {}
        return True

    source_config: dict[str, Any] = entry.data.get(CONF_SOURCE_CONFIG, {})
    layout: dict[str, Any] = entry.data.get(CONF_LAYOUT, {})
    action_ids: list[str] = layout.get(CONF_ACTIONS, [])

    store.async_ensure_remote(entry.entry_id, source, source_config, layout)

    # Attach the entry to the remote's existing registry device — gives a
    # device page grouping our slots/automations.
    if device_id := source_config.get(CONF_DEVICE_ID):
        device_registry = dr.async_get(hass)
        if device_registry.async_get(device_id):
            device_registry.async_update_device(
                device_id, add_config_entry_id=entry.entry_id
            )
        else:
            _LOGGER.warning(
                "Device %s for remote %s no longer exists", device_id, entry.title
            )

    dispatcher = SlotDispatcher(
        hass,
        entry.entry_id,
        entry.title,
        store,
        get_adapter(source),
        source_config,
        action_ids,
    )
    try:
        await dispatcher.async_attach()
    except HomeAssistantError as err:
        # e.g. MQTT discovery not arrived yet after restart — retry later
        raise ConfigEntryNotReady(str(err)) from err

    entry.async_on_unload(dispatcher.async_detach)
    hass.data[DOMAIN][entry.entry_id] = {"dispatcher": dispatcher}
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload one remote; detach handled via entry.async_on_unload."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    store: RemoteMapperStore = hass.data[DOMAIN]["store"]
    await store.async_flush()
    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Drop the remote's store data when the entry is deleted."""
    store: RemoteMapperStore | None = hass.data.get(DOMAIN, {}).get("store")
    if store is not None:
        store.async_remove_remote(entry.entry_id)
        await store.async_flush()

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

    async def _post_setup(_event: Any = None) -> None:
        from .const import EVENT_UPDATED
        from .materializer import async_check_orphans

        orphaned = await async_check_orphans(hass, store, entry.entry_id)
        if orphaned:
            hass.bus.async_fire(
                EVENT_UPDATED,
                {
                    "entry_id": entry.entry_id,
                    "kind": "orphans_reset",
                    "action_ids": orphaned,
                },
            )
        await async_refresh_actions(hass, store, entry)

    # Deferred: the automation component (and lazy MQTT discovery) may
    # not be ready at our setup; the yaml fallback keeps it safe anyway.
    if hass.state is CoreState.running:
        entry.async_create_task(hass, _post_setup())
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _post_setup)
    return True


async def async_refresh_actions(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry: ConfigEntry,
) -> dict[str, Any]:
    """Additive drift diff (design §9, plan M7) — at setup and on demand.

    Re-probe the source: newly discovered actions are ADDED to the layout
    and the live subscription; configured actions the source no longer
    reports are flagged stale (card badge) — never removed, mappings are
    user state. An empty probe is skipped: fallback adapters can't
    enumerate, and a broker hiccup must not flag everything stale.

    Returns {"added": [...], "stale": [...], "probed": bool}.
    """
    from .adapters import get_adapter
    from .const import EVENT_UPDATED

    remote = store.get_remote(entry.entry_id)
    if remote is None:
        return {"added": [], "stale": [], "probed": False}
    configured_actions: list[str] = list(remote["layout"].get(CONF_ACTIONS, []))
    adapter = get_adapter(remote["source"])
    probed = await adapter.async_default_actions(hass, remote["source_config"])
    if not probed:
        return {"added": [], "stale": remote.get("stale_actions", []), "probed": False}

    added = [a for a in probed if a not in configured_actions]
    stale = sorted(a for a in configured_actions if a not in probed)
    changed = False
    if added:
        remote["layout"][CONF_ACTIONS] = [*configured_actions, *added]
        changed = True
        _LOGGER.info(
            "Remote %s: newly discovered actions %s added to layout",
            entry.title,
            added,
        )
        runtime = hass.data[DOMAIN].get(entry.entry_id) or {}
        if dispatcher := runtime.get("dispatcher"):
            try:
                await dispatcher.async_update_actions(remote["layout"][CONF_ACTIONS])
            except HomeAssistantError as err:
                _LOGGER.warning("Remote %s: re-subscribe failed: %s", entry.title, err)
    if remote.get("stale_actions") != stale:
        remote["stale_actions"] = stale
        changed = True
        if stale:
            _LOGGER.warning(
                "Remote %s: configured actions %s no longer reported by the "
                "source (renamed upstream?) — flagged stale",
                entry.title,
                stale,
            )
    if changed:
        store.async_schedule_save()
        hass.bus.async_fire(
            EVENT_UPDATED,
            {
                "entry_id": entry.entry_id,
                "kind": "drift",
                "added": added,
                "stale": stale,
            },
        )
    return {"added": added, "stale": stale, "probed": True}


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload one remote; detach handled via entry.async_on_unload."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    store: RemoteMapperStore = hass.data[DOMAIN]["store"]
    await store.async_flush()
    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Drop the remote's data + owned artifacts when the entry is deleted.

    Bulk cleanup follows the owned_scene_cleanup policy; only
    always_delete removes artifacts (nothing is deleted silently).
    """
    from .cleanup import async_cleanup_entry

    store: RemoteMapperStore | None = hass.data.get(DOMAIN, {}).get("store")
    if store is not None:
        await async_cleanup_entry(hass, store, entry)
        store.async_remove_remote(entry.entry_id)
        await store.async_flush()

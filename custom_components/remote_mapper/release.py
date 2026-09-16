"""Hand a remote back to Home Assistant — opt out without losing anything.

Per slot:
- imported from automation(s) → the originals are re-enabled (the slot
  goes away, so nothing runs twice);
- materialized → the automation stays, its ``[remote_mapper]`` alias and
  "auto-managed" description are replaced so it reads as a plain one;
- built in the card → converted to a plain automation (optional), else
  dropped.
Snapshot scenes are ordinary scenes and are kept; only our ownership
record goes. Finally the config entry is removed.

``async_reenable_imported`` is also the safety net for a plain "delete
integration": originals must never stay disabled behind our back.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)


def imported_sources(slot: dict[str, Any]) -> list[dict[str, Any]]:
    """Original automation(s) an imported slot came from."""
    origin = slot.get("imported_from")
    if not origin:
        return []
    sources = origin.get("sources") or [origin]
    return [s for s in sources if s.get("entity_id")]


async def async_reenable_imported(
    hass: HomeAssistant, store: RemoteMapperStore, entry_id: str
) -> list[str]:
    """Turn the imported originals of every slot back on. Returns entity ids."""
    remote = store.get_remote(entry_id)
    if remote is None:
        return []
    entity_ids = sorted(
        {
            source["entity_id"]
            for slot in remote.get("slots", {}).values()
            for source in imported_sources(slot)
        }
    )
    present = [e for e in entity_ids if hass.states.get(e) is not None]
    if present:
        await hass.services.async_call(
            "automation", "turn_on", {ATTR_ENTITY_ID: present}, blocking=True
        )
        _LOGGER.info("%s: re-enabled imported originals %s", DOMAIN, present)
    return present


async def async_release_remote(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry: ConfigEntry,
    convert_remaining: bool = True,
) -> dict[str, Any]:
    """Undo the integration's footprint for one remote, then remove it."""
    from .materializer import async_materialize, async_unmanage

    remote = store.get_remote(entry.entry_id)
    if remote is None:
        return {"reenabled": [], "converted": [], "kept": [], "dropped": []}

    summary: dict[str, list[str]] = {
        "reenabled": [],
        "converted": [],
        "kept": [],
        "dropped": [],
        "scenes_kept": [],
    }
    summary["reenabled"] = await async_reenable_imported(hass, store, entry.entry_id)

    unmanaged: dict[str, bool] = {}  # shared automation: unmanage once
    for action_id, slot in list(remote.get("slots", {}).items()):
        if imported_sources(slot) and not slot.get("materialized"):
            continue  # originals are back — the slot just goes away
        plain_alias = f"{entry.title} · {slot.get('name') or action_id}"
        if slot.get("materialized") and slot.get("automation_id"):
            config_id = slot["automation_id"]
            if not slot.get("owned", True):
                summary["kept"].append(action_id)  # linked: not ours, untouched
                continue
            if slot.get("shared_automation"):
                plain_alias = entry.title
            if config_id not in unmanaged:
                unmanaged[config_id] = await async_unmanage(hass, config_id, plain_alias)
            if unmanaged[config_id]:
                summary["kept"].append(action_id)
            else:
                summary["dropped"].append(action_id)
        elif convert_remaining and slot.get("sequence") and not slot.get("archived"):
            try:
                config_id = await async_materialize(
                    hass, store, entry.entry_id, action_id, entry.title
                )
                await async_unmanage(hass, config_id, plain_alias)
                summary["converted"].append(action_id)
            except Exception as err:  # keep going, report
                _LOGGER.warning("%s: could not convert %s: %s", DOMAIN, action_id, err)
                summary["dropped"].append(action_id)
        else:
            summary["dropped"].append(action_id)

    # Scenes stay; dropping ownership means nothing will ever ask about them
    summary["scenes_kept"] = store.owned_scenes_for(entry.entry_id)
    for scene_id in summary["scenes_kept"]:
        store.async_drop_owned_scene(scene_id)

    # Nothing left for the entry-removal cleanup to delete
    remote["slots"] = {}
    store.async_schedule_save()
    await hass.config_entries.async_remove(entry.entry_id)
    return summary

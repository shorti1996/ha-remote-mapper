# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Snapshot-to-persistent-scene flow (design §8).

Set the room how you like it → press save on the card → the state
becomes a persistent scene bound to a button. Persistent because
dynamic scene.create snapshots die on restart. Re-snapshot updates the
same scene in place — same id, same entity set, new states — so presets
evolve without versioned clutter or orphans.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import TYPE_CHECKING, Any

from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .scene_api import get_scene_config_store, scene_entity_id
from .store import default_slot

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)

# State-machine noise that is not reproducible state
_ATTR_DENYLIST = {
    "friendly_name",
    "icon",
    "entity_picture",
    "supported_features",
    "device_class",
    "state_class",
    "unit_of_measurement",
    "attribution",
    "assumed_state",
    "restored",
    "supported_color_modes",
    "last_changed",
    "last_updated",
    "context",
}


# Domains HA's scene editor leaves out when a whole device is added
# (frontend src/data/scene.ts SCENE_IGNORED_DOMAINS, 2026-09)
_DEVICE_IGNORED_DOMAINS = frozenset(
    {
        "binary_sensor",
        "button",
        "configuration",
        "device_tracker",
        "event",
        "image_processing",
        "infrared",
        "input_button",
        "persistent_notification",
        "person",
        "radio_frequency",
        "scene",
        "schedule",
        "script",
        "sensor",
        "sun",
        "update",
        "weather",
        "zone",
    }
)


def device_entities(hass: HomeAssistant, device_ids: list[str]) -> list[str]:
    """A device's capturable entities, picked the way HA's scene editor does.

    Enabled, not hidden, no entity category, domain not on HA's ignore
    list. Order: devices as given, entities as the registry lists them.
    """
    registry = er.async_get(hass)
    out: list[str] = []
    for device_id in device_ids:
        for entry in er.async_entries_for_device(registry, device_id):
            if entry.hidden_by or entry.entity_category:
                continue
            if entry.domain in _DEVICE_IGNORED_DOMAINS:
                continue
            out.append(entry.entity_id)
    return out


def scene_config_id(entry_id: str, action_id: str) -> str:
    """Deterministic scene id per slot — re-snapshot reuses it."""
    return f"{DOMAIN}_{entry_id}_{action_id}"


async def _free_scene_id(
    hass: HomeAssistant, store: RemoteMapperStore, base: str
) -> str:
    """``base``, or ``base_2``, ``base_3``… when a scene already has it.

    A moved slot takes its scene's id along, and a scene kept on clear
    outlives its slot; a new snapshot at the event they came from gets a
    scene of its own instead of overwriting theirs.
    """
    scenes = get_scene_config_store(hass)
    candidate, n = base, 1
    while (
        store.get_owned_scene(candidate) is not None
        or await scenes.async_get(candidate) is not None
    ):
        n += 1
        candidate = f"{base}_{n}"
    return candidate


def _plain(value: Any) -> Any:
    """Enum members → their value, recursively.

    HA 2026.7 keys light attributes with a StrEnum
    (``LightEntityCapabilityAttribute``) and stores ``ColorMode`` members as
    values; ``homeassistant.util.yaml.dump`` refuses both, so a capture of
    any light failed with "cannot represent an object".
    """
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {_plain(k): _plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_plain(v) for v in value]
    return value


def capture_entities(hass: HomeAssistant, entity_ids: list[str]) -> dict[str, Any]:
    """Current states → scene entities map."""
    entities: dict[str, Any] = {}
    for entity_id in entity_ids:
        state = hass.states.get(entity_id)
        if state is None:
            _LOGGER.warning("Snapshot: %s has no state, skipping", entity_id)
            continue
        attrs = {
            _plain(key): _plain(value)
            for key, value in state.attributes.items()
            if str(key) not in _ATTR_DENYLIST and value is not None
        }
        entities[entity_id] = {"state": state.state, **attrs}
    return entities


async def async_create_snapshot(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    entity_ids: list[str],
    name: str,
    re_snapshot: bool = False,
    device_ids: list[str] | None = None,
) -> dict[str, Any]:
    """Capture states into a persistent scene bound to the slot.

    ``device_ids`` capture whole devices (every capturable entity, as HA's
    scene editor picks them); ``entity_ids`` capture just those entities
    and are marked ``entity_only`` so HA's editor shows them alone, not
    their device. A re-snapshot keeps both lists and re-expands the
    devices, so an entity a device gained since is captured too.

    A re-snapshot changes only the scene's states: the slot, and the
    automation or branch calling the scene, keep their actions.
    """
    device_ids = list(device_ids or [])
    # A slot moved from another event keeps its scene: reuse that id so a
    # capture updates it instead of leaving an orphan behind.
    existing = store.get_slot(entry_id, action_id)
    owned_id = existing.get("scene_id") if existing else None
    if owned_id and store.get_owned_scene(owned_id) is not None:
        config_id = owned_id
    elif re_snapshot:
        raise HomeAssistantError("Slot has no owned scene to re-snapshot")
    else:
        config_id = await _free_scene_id(
            hass, store, scene_config_id(entry_id, action_id)
        )

    if re_snapshot:
        record = store.get_owned_scene(config_id)
        device_ids = list(record.get("devices", []))
        entity_ids = list(record.get("picked_entities", record["entities"]))

    from_devices = device_entities(hass, device_ids)
    entities = capture_entities(hass, list(dict.fromkeys([*from_devices, *entity_ids])))
    if not entities:
        raise HomeAssistantError("No capturable entities for snapshot")
    # An entity picked on its own shows alone in HA's scene editor; one
    # that came with its device shows under the device, like HA writes it
    metadata = {
        entity_id: {"entity_only": True}
        for entity_id in entity_ids
        if entity_id in entities and entity_id not in from_devices
    }

    payload: dict[str, Any] = {"name": name, "entities": entities}
    if metadata:
        payload["metadata"] = metadata
    await get_scene_config_store(hass).async_upsert(config_id, payload)

    entity_id = scene_entity_id(hass, config_id)
    if entity_id is None:
        raise HomeAssistantError(f"Scene {config_id} did not register")

    store.async_register_owned_scene(
        config_id,
        created_for=f"{entry_id}/{action_id}",
        entities=list(entities),
        devices=device_ids,
        picked_entities=[e for e in entity_ids if e in entities],
    )

    if not re_snapshot:
        slot = store.get_slot(entry_id, action_id) or default_slot()
        # Canonical single-turn_on form — the only writer of scene_id (§4)
        slot["sequence"] = [
            {"action": "scene.turn_on", "target": {"entity_id": entity_id}}
        ]
        slot["scene_id"] = config_id
        store.async_set_slot(entry_id, action_id, slot)

    return {
        "scene_id": config_id,
        "scene_entity_id": entity_id,
        "entities": list(entities),
        "devices": device_ids,
        "picked_entities": [e for e in entity_ids if e in entities],
        "created_at": dt_util.utcnow().isoformat(),
    }


def _single_scene_call(actions: Any) -> str | None:
    """The scene entity id when ``actions`` is just one scene.turn_on."""
    if not isinstance(actions, list) or len(actions) != 1:
        return None
    step = actions[0]
    if (
        not isinstance(step, dict)
        or step.get("action", step.get("service")) != "scene.turn_on"
    ):
        return None
    target = step.get("target") or {}
    entity_id = target.get("entity_id", step.get("entity_id"))
    if isinstance(entity_id, list) and len(entity_id) == 1:
        entity_id = entity_id[0]
    return (
        entity_id
        if isinstance(entity_id, str) and entity_id.startswith("scene.")
        else None
    )


def _scene_exists(hass: HomeAssistant, entity_id: str) -> bool:
    return er.async_get(hass).async_get(entity_id) is not None or (
        hass.states.get(entity_id) is not None
    )


async def async_settle_gone_scenes(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    removed: str | None = None,
) -> list[str]:
    """Free the events whose scene was deleted behind our back.

    HA's scene editor drops the scenes.yaml entry and removes the registry
    entity, so the event would keep calling a scene that no longer exists.
    An event that does nothing but call the vanished scene goes back to
    "not set": its per-event automation or branch of the remote's shared
    one is removed with it, and the ownership record goes. An event with
    more actions than the scene call keeps them and is left alone.

    ``removed`` is the entity id from the registry event; without it (at
    start) only owned snapshot scenes are checked, since a hand-made yaml
    scene need not have a registry entry at all.
    """
    from .cleanup import DECISION_DELETE, async_cleanup_artifacts, collect_artifacts
    from .materializer import async_get_live_view, is_linked
    from .remote_automation import async_remove_branch, is_shared

    remote = store.get_remote(entry_id)
    if remote is None:
        return []
    scenes = get_scene_config_store(hass)
    freed: list[str] = []
    for action_id, slot in list(remote.get("slots", {}).items()):
        if is_linked(slot):
            continue  # linked: the native automation is the user's to edit
        owned_id = slot.get("scene_id")
        if owned_id:
            if scene_entity_id(hass, owned_id) is not None:
                continue
            if await scenes.async_get(owned_id) is not None:
                continue
        elif removed is None:
            continue
        if slot.get("materialized"):
            live = await async_get_live_view(hass, slot, action_id)
            actions = live["actions"] if live else None
        else:
            actions = slot.get("sequence")
        # An automation that vanished with the scene has nothing to keep
        if actions is not None:
            called = _single_scene_call(actions)
            if called is None:
                continue
            if removed is not None and called != removed:
                continue
            if removed is None and _scene_exists(hass, called):
                continue
        elif not owned_id:
            continue
        # The awaits above may have let a move or an edit rewrite the slot
        current = store.get_slot(entry_id, action_id)
        if current is None or current.get("scene_id") != owned_id:
            continue
        artifacts = collect_artifacts(hass, store, entry_id, action_id)
        artifacts.pop("scene", None)
        await async_cleanup_artifacts(hass, store, artifacts, DECISION_DELETE)
        if is_shared(current):
            await async_remove_branch(hass, entry_id, action_id)
        if owned_id:
            store.async_drop_owned_scene(owned_id)
        store.async_clear_slot(entry_id, action_id)
        freed.append(action_id)
    if freed:
        _LOGGER.warning(
            "Remote %s: scenes for %s were deleted in HA — the events are free again",
            entry_id,
            freed,
        )
    return freed

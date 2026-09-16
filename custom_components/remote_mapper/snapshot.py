# SPDX-License-Identifier: AGPL-3.0-only
"""Snapshot-to-persistent-scene flow (design §8).

Set the room how you like it → press save on the card → the state
becomes a persistent scene bound to a button. Persistent because
dynamic scene.create snapshots die on restart. Re-snapshot updates the
same scene in place — same id, same entity set, new states — so presets
evolve without versioned clutter or orphans.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.exceptions import HomeAssistantError
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


def scene_config_id(entry_id: str, action_id: str) -> str:
    """Deterministic scene id per slot — re-snapshot reuses it."""
    return f"{DOMAIN}_{entry_id}_{action_id}"


def capture_entities(hass: HomeAssistant, entity_ids: list[str]) -> dict[str, Any]:
    """Current states → scene entities map."""
    entities: dict[str, Any] = {}
    for entity_id in entity_ids:
        state = hass.states.get(entity_id)
        if state is None:
            _LOGGER.warning("Snapshot: %s has no state, skipping", entity_id)
            continue
        attrs = {
            key: value
            for key, value in state.attributes.items()
            if key not in _ATTR_DENYLIST and value is not None
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
) -> dict[str, Any]:
    """Capture states into a persistent scene bound to the slot."""
    config_id = scene_config_id(entry_id, action_id)

    if re_snapshot:
        owned = store.get_owned_scene(config_id)
        if owned is None:
            raise HomeAssistantError("Slot has no owned scene to re-snapshot")
        entity_ids = owned["entities"]

    entities = capture_entities(hass, entity_ids)
    if not entities:
        raise HomeAssistantError("No capturable entities for snapshot")

    await get_scene_config_store(hass).async_upsert(
        config_id, {"name": name, "entities": entities}
    )

    entity_id = scene_entity_id(hass, config_id)
    if entity_id is None:
        raise HomeAssistantError(f"Scene {config_id} did not register")

    store.async_register_owned_scene(
        config_id,
        created_for=f"{entry_id}/{action_id}",
        entities=list(entities),
    )

    slot = store.get_slot(entry_id, action_id) or default_slot()
    # Canonical single-turn_on form — the only writer of scene_id (§4)
    slot["sequence"] = [{"action": "scene.turn_on", "target": {"entity_id": entity_id}}]
    slot["scene_id"] = config_id
    store.async_set_slot(entry_id, action_id, slot)

    return {
        "scene_id": config_id,
        "scene_entity_id": entity_id,
        "entities": list(entities),
        "created_at": dt_util.utcnow().isoformat(),
    }

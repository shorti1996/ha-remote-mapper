# SPDX-License-Identifier: AGPL-3.0-only
"""Fallback adapter: `event.*_action` entities (modern Z2M/HA path).

Still experimental upstream (opt-in experimental_event_entities, naming
evolving) — device_trigger stays the default. build_trigger emits the
2026.7 purpose-specific `event.received` trigger; on older HA the
materialize-time validation rejects it cleanly (feature detection by
validation, no floor bump).
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import callback
from homeassistant.helpers.event import async_track_state_change_event

from ..const import ADAPTER_EVENT_ENTITY, CONF_ENTITY_ID

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant

    from .base import ActionCallback

_LOGGER = logging.getLogger(__name__)


class EventEntityAdapter:
    """Adapter over an event entity's event_type stream."""

    id = ADAPTER_EVENT_ENTITY
    label = "Event entity (event.*_action)"

    async def async_default_actions(
        self, hass: HomeAssistant, config: dict[str, Any]
    ) -> list[str]:
        """The entity advertises its actions via the event_types attribute."""
        state = hass.states.get(config[CONF_ENTITY_ID])
        if state is None:
            return []
        return [str(t) for t in state.attributes.get("event_types", [])]

    def build_trigger(self, action_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """2026.7 purpose-specific trigger (validated at materialize time)."""
        return {
            "platform": "event.received",
            "target": {"entity_id": config[CONF_ENTITY_ID]},
            "options": {"event_type": [action_id]},
        }

    async def async_subscribe(
        self,
        hass: HomeAssistant,
        config: dict[str, Any],
        action_ids: list[str],
        on_action: ActionCallback,
        name: str,
    ) -> CALLBACK_TYPE:
        """Track the entity; each state write carries the fired event_type."""
        entity_id = config[CONF_ENTITY_ID]

        @callback
        def _changed(event: Event) -> None:
            state = event.data.get("new_state")
            if state is None or state.state in ("unknown", "unavailable"):
                return
            if event_type := state.attributes.get("event_type"):
                on_action(str(event_type), {"entity_id": entity_id})

        return async_track_state_change_event(hass, [entity_id], _changed)

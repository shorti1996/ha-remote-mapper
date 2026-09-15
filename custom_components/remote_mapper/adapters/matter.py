"""Matter / multi-button remote adapter.

A Matter remote exposes each physical button as its OWN `event.*` entity
(e.g. `event.bilresa_button_1`, `event.bilresa_button_2`), all under one
registry device. The single-entity event adapter would only ever see one
button's events; this adapter groups every button of a device into one
card.

Action ids are namespaced `{button_token}:{event_type}` — the button
token is derived once, at config time, and frozen into
`source_config[CONF_BUTTONS]` (a `{token: entity_id}` map) so stored slot
keys never shift when the device's entity set changes.

build_trigger emits the same 2026.7 `event.received` trigger the single
event adapter uses (validated at materialize time).
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_track_state_change_event

from ..const import ADAPTER_MATTER, CONF_BUTTONS

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant

    from .base import ActionCallback

_LOGGER = logging.getLogger(__name__)

_UNAVAILABLE = ("unknown", "unavailable")


def button_tokens(entity_ids: list[str]) -> dict[str, str]:
    """Map each event entity id -> a short, stable, unique button token.

    Strips the segments the object ids share, keeping the last shared
    segment for context (`..._button_1` / `..._button_2` -> `button_1` /
    `button_2`). Falls back to a positional token, and disambiguates any
    collision, so the result is always a bijection.
    """
    object_ids = [eid.split(".", 1)[-1] for eid in entity_ids]
    segs = [oid.split("_") for oid in object_ids]

    common = 0
    if len(segs) > 1:
        # Uneven segment counts stop the shared run at the shortest id.
        for parts in zip(*segs, strict=False):
            if len(set(parts)) == 1:
                common += 1
            else:
                break
        # Never consume every segment of the shortest object id.
        common = min(common, min(len(s) for s in segs) - 1)
    # Keep one shared segment for readability when anything was stripped.
    start = max(0, common - 1) if common else 0

    tokens: dict[str, str] = {}
    used: set[str] = set()
    for i, (eid, parts) in enumerate(zip(entity_ids, segs, strict=True)):
        base = "_".join(parts[start:]) or f"b{i + 1}"
        token = base
        n = 2
        while token in used:
            token = f"{base}_{n}"
            n += 1
        used.add(token)
        tokens[eid] = token
    return tokens


class MatterRemoteAdapter:
    """Adapter over several `event.*` entities of one device."""

    id = ADAPTER_MATTER
    label = "Matter / multi-button remote (event.*)"

    @staticmethod
    def _buttons(config: dict[str, Any]) -> dict[str, str]:
        """Return the frozen {button_token: entity_id} map."""
        return dict(config.get(CONF_BUTTONS, {}))

    async def async_default_actions(
        self, hass: HomeAssistant, config: dict[str, Any]
    ) -> list[str]:
        """Enumerate `{token}:{event_type}` across every button entity."""
        actions: list[str] = []
        for token, entity_id in self._buttons(config).items():
            state = hass.states.get(entity_id)
            if state is None:
                continue
            for event_type in state.attributes.get("event_types", []):
                actions.append(f"{token}:{event_type}")
        return actions

    def build_trigger(self, action_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """2026.7 purpose-specific trigger for the button entity."""
        token, _, event_type = action_id.partition(":")
        entity_id = self._buttons(config).get(token)
        return {
            "platform": "event.received",
            "target": {"entity_id": entity_id},
            "options": {"event_type": [event_type]},
        }

    async def async_subscribe(
        self,
        hass: HomeAssistant,
        config: dict[str, Any],
        action_ids: list[str],
        on_action: ActionCallback,
        name: str,
    ) -> CALLBACK_TYPE:
        """Track every button entity; namespace the fired event by button."""
        by_entity = {eid: token for token, eid in self._buttons(config).items()}
        entity_ids = list(by_entity)
        if not entity_ids:
            raise HomeAssistantError(f"No button entities configured for {name}")

        @callback
        def _changed(event: Event) -> None:
            entity_id = event.data.get("entity_id")
            token = by_entity.get(entity_id)
            if token is None:
                return
            state = event.data.get("new_state")
            if state is None or state.state in _UNAVAILABLE:
                return
            if event_type := state.attributes.get("event_type"):
                on_action(f"{token}:{event_type}", {"entity_id": entity_id})

        return async_track_state_change_event(hass, entity_ids, _changed)

# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Button grouping — action ids → physical buttons x events.

Derived on every read, never stored: the card needs "button" as a unit
(grid layout, display modes) while adapters only know opaque action ids.
Grouping is per source:

- ``matter``: ``{token}:{event}`` — namespaced at config time.
- ``event_entity``: one entity == one button; every action is an event.
- everything else (device_trigger, z2m_mqtt, mqtt_generic): Zigbee2MQTT
  vocabulary ``{button}_{event}`` — split at the last suffix that is a
  known event token, two-token suffixes (``press_release``) tried first.
  Ids with no event suffix are tried event-first, ``{event}_{button}``
  (Aqara ``single_left``, Sonoff ``single_button_1``, Hue Tap ``press_1``).
  A bare event token (``single``) is a single-button device.

``kind`` classifies events for the card's gesture mapping and icons.
Unknown events keep their name and get kind ``other`` — nothing is hidden.
"""

from __future__ import annotations

import re
from typing import Any, Final

from .const import ADAPTER_EVENT_ENTITY, ADAPTER_MATTER

SINGLE_BUTTON_ID: Final = "button"
DEFAULT_EVENT: Final = "press"

KIND_SINGLE: Final = "single"
KIND_DOUBLE: Final = "double"
KIND_TRIPLE: Final = "triple"
KIND_HOLD: Final = "hold"
KIND_RELEASE: Final = "release"
KIND_OTHER: Final = "other"

# Canonical order of events inside a button (chips, sheets, gestures).
_KIND_ORDER: Final[dict[str, int]] = {
    KIND_SINGLE: 0,
    KIND_DOUBLE: 1,
    KIND_TRIPLE: 2,
    KIND_HOLD: 3,
    KIND_RELEASE: 4,
    KIND_OTHER: 5,
}

# Event token → kind. Covers Z2M (Tuya/Aqara/IKEA/Hue), Matter and
# event-entity vocabularies. Tokens mapped to "other" are still recognized
# as event suffixes (so ``1_quadruple`` groups under button ``1``).
_KIND_BY_EVENT: Final[dict[str, str]] = {
    "single": KIND_SINGLE,
    "click": KIND_SINGLE,
    "press": KIND_SINGLE,
    "pressed": KIND_SINGLE,
    "short": KIND_SINGLE,
    "short_press": KIND_SINGLE,
    "single_press": KIND_SINGLE,
    "single_click": KIND_SINGLE,
    "multi_press_1": KIND_SINGLE,
    "double": KIND_DOUBLE,
    "double_press": KIND_DOUBLE,
    "double_click": KIND_DOUBLE,
    "double_pressed": KIND_DOUBLE,
    "multi_press_2": KIND_DOUBLE,
    "triple": KIND_TRIPLE,
    "tripple": KIND_TRIPLE,  # Z2M's spelling for the LeTV 8-key remote
    "triple_press": KIND_TRIPLE,
    "triple_click": KIND_TRIPLE,
    "multi_press_3": KIND_TRIPLE,
    "hold": KIND_HOLD,
    "held": KIND_HOLD,
    "long": KIND_HOLD,
    "longpress": KIND_HOLD,
    "long_press": KIND_HOLD,
    "long_click": KIND_HOLD,
    "release": KIND_RELEASE,
    "released": KIND_RELEASE,
    "long_release": KIND_RELEASE,
    "longpress_release": KIND_RELEASE,
    "hold_release": KIND_RELEASE,
    "press_release": KIND_RELEASE,
    "quadruple": KIND_OTHER,
    "quintuple": KIND_OTHER,
    "many": KIND_OTHER,  # Aqara: five or more presses
    "quadruple_press": KIND_OTHER,
    "quintuple_press": KIND_OTHER,
    "multi_press_4": KIND_OTHER,
    "multi_press_5": KIND_OTHER,
}

_NATURAL_SPLIT = re.compile(r"(\d+)")


def event_kind(event: str) -> str:
    """Classify an event token; unknown → ``other``."""
    return _KIND_BY_EVENT.get(event, KIND_OTHER)


def natural_key(value: str) -> tuple[Any, ...]:
    """Sort key treating digit runs numerically (``1, 2, 10``)."""
    return tuple(
        int(part) if part.isdigit() else part for part in _NATURAL_SPLIT.split(value)
    )


def split_z2m_action(action_id: str) -> tuple[str, str]:
    """``{button}_{event}`` → (button, event) using the known event tokens.

    Two-token events win over one-token ones (``on_press_release`` →
    ``on`` / ``press_release``). With no event suffix, an event prefix
    splits the other way (``single_left`` → ``left`` / ``single``). A bare
    event token means a single-button device. No known event → the whole
    id is the button, event ``press``.
    """
    if action_id in _KIND_BY_EVENT:
        return SINGLE_BUTTON_ID, action_id
    parts = action_id.split("_")
    for take in (2, 1):
        if len(parts) > take:
            suffix = "_".join(parts[-take:])
            if suffix in _KIND_BY_EVENT:
                return "_".join(parts[:-take]), suffix
    for take in (2, 1):
        if len(parts) > take:
            prefix = "_".join(parts[:take])
            if prefix in _KIND_BY_EVENT:
                return "_".join(parts[take:]), prefix
    return action_id, DEFAULT_EVENT


def split_action(source: str | None, action_id: str) -> tuple[str, str]:
    """Return (button_id, event) for one action id of the given source."""
    if source == ADAPTER_MATTER and ":" in action_id:
        token, _, event = action_id.partition(":")
        return token, event
    if source == ADAPTER_EVENT_ENTITY:
        return SINGLE_BUTTON_ID, action_id
    return split_z2m_action(action_id)


def group_buttons(source: str | None, action_ids: list[str]) -> list[dict[str, Any]]:
    """Group action ids into buttons; natural order, events in kind order.

    Result shape (JSON-ready, consumed by the card)::

        [{"id": "1", "label": "1",
          "actions": [{"action_id": "1_single", "event": "single",
                       "kind": "single"}, ...]}, ...]
    """
    grouped: dict[str, list[dict[str, Any]]] = {}
    seen: set[str] = set()
    for action_id in action_ids:
        if action_id in seen:
            continue
        seen.add(action_id)
        button_id, event = split_action(source, action_id)
        grouped.setdefault(button_id, []).append(
            {"action_id": action_id, "event": event, "kind": event_kind(event)}
        )

    buttons = []
    for button_id in sorted(grouped, key=natural_key):
        actions = sorted(
            grouped[button_id],
            key=lambda a: (_KIND_ORDER[a["kind"]], natural_key(a["event"])),
        )
        buttons.append({"id": button_id, "label": button_id, "actions": actions})
    return buttons

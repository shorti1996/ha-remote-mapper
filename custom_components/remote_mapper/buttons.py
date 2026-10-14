# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Button grouping — action ids → physical buttons x events.

Derived on every read, never stored: the card needs "button" as a unit
(grid layout, display modes) while adapters only know opaque action ids.
Grouping is per source:

- ``matter``: ``{token}:{event}`` — namespaced at config time.
- ``event_entity``: one entity == one button; every action is an event.
- ``device_trigger`` ids with a colon: ``{subtype}:{type}``, the adapter's
  id for a subtype the platform lists under several trigger types (ZHA,
  deCONZ, Hue: subtype = button, type = press kind). Button = subtype,
  event = the type without its ``remote_button_`` prefix, kind from
  ``_KIND_BY_TYPE``.
- everything else (device_trigger, z2m_mqtt, mqtt_generic): Zigbee2MQTT
  vocabulary ``{button}_{event}`` — split at the last suffix that is a
  known event token, two-token suffixes (``press_release``) tried first.
  Ids with no event suffix are tried event-first, ``{event}_{button}``
  (Aqara ``single_left``, Sonoff ``single_button_1``, Hue Tap ``press_1``).
  A bare event token (``single``) is a single-button device.

``kind`` classifies events for the card's gesture mapping and icons.
Unknown events keep their name and get kind ``other`` — nothing is hidden.

A remote's ``grouping`` (plan 09) overrides the derivation per action:
``{action_id: {"button": id, "kind": kind}}``. An action listed there sits
on that button with that kind; every other action is derived as above. A
button id is just a name — naming a derived button merges into it, a new
name makes a new button.
"""

from __future__ import annotations

import re
from typing import Any, Final

from .const import ADAPTER_DEVICE_TRIGGER, ADAPTER_EVENT_ENTITY, ADAPTER_MATTER

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

# Device-trigger type → kind, for ``{subtype}:{type}`` ids. ZHA and deCONZ
# share the ``remote_button_*`` vocabulary; Hue v2 uses bare names, where
# the click is ``short_release`` (``initial_press`` fires at the start of
# every press, before the kind is known). ZHA quirks that put the kind in
# the type as ``button_single`` are listed too; a type not here falls
# back to ``_KIND_BY_EVENT`` on the stripped name, then ``other``.
_KIND_BY_TYPE: Final[dict[str, str]] = {
    "remote_button_short_press": KIND_SINGLE,
    "remote_button_double_press": KIND_DOUBLE,
    "remote_button_triple_press": KIND_TRIPLE,
    "remote_button_long_press": KIND_HOLD,
    "remote_button_short_release": KIND_RELEASE,
    "remote_button_long_release": KIND_RELEASE,
    "remote_button_quadruple_press": KIND_OTHER,
    "remote_button_quintuple_press": KIND_OTHER,
    "short_release": KIND_SINGLE,
    "initial_press": KIND_OTHER,
    "repeat": KIND_OTHER,
    "button_single": KIND_SINGLE,
    "button_double": KIND_DOUBLE,
    "button_hold": KIND_HOLD,
}
_TYPE_PREFIX: Final = "remote_button_"

_NATURAL_SPLIT = re.compile(r"(\d+)")


def event_kind(event: str) -> str:
    """Classify an event token; unknown → ``other``."""
    return _KIND_BY_EVENT.get(event, KIND_OTHER)


def trigger_type_event(trigger_type: str) -> tuple[str, str]:
    """(event, kind) for a device-trigger type (``remote_button_long_press``)."""
    event = trigger_type.removeprefix(_TYPE_PREFIX)
    return event, _KIND_BY_TYPE.get(trigger_type, event_kind(event))


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


def derive_action(source: str | None, action_id: str) -> tuple[str, str, str]:
    """Return (button_id, event, kind) for one action id, no grouping applied."""
    if source == ADAPTER_MATTER and ":" in action_id:
        token, _, event = action_id.partition(":")
        return token, event, event_kind(event)
    if source == ADAPTER_DEVICE_TRIGGER and ":" in action_id:
        subtype, _, trigger_type = action_id.partition(":")
        event, kind = trigger_type_event(trigger_type)
        return subtype, event, kind
    if source == ADAPTER_EVENT_ENTITY:
        return SINGLE_BUTTON_ID, action_id, event_kind(action_id)
    button_id, event = split_z2m_action(action_id)
    return button_id, event, event_kind(event)


def split_action(source: str | None, action_id: str) -> tuple[str, str]:
    """Return (button_id, event) for one action id of the given source."""
    button_id, event, _kind = derive_action(source, action_id)
    return button_id, event


def place_action(
    source: str | None, grouping: dict[str, Any] | None, action_id: str
) -> tuple[str, str, str]:
    """Return (button_id, event, kind) for one action, grouping applied.

    An action that only changes kind keeps its derived event name
    (``arrow_left_click`` stays ``click``). One moved to another button
    shows its action id as the event, so a sheet never lists two rows
    called ``press`` and says what fires.
    """
    button_id, event, derived_kind = derive_action(source, action_id)
    override = (grouping or {}).get(action_id)
    if not override:
        return button_id, event, derived_kind
    target = str(override.get("button") or button_id)
    kind = str(override.get("kind") or derived_kind)
    if kind not in _KIND_ORDER:
        kind = KIND_OTHER
    return target, event if target == button_id else action_id, kind


def grouping_conflict(
    buttons: list[dict[str, Any]], changed: str | None = None
) -> str | None:
    """A sentence naming the first named kind that appears twice on a button.

    single, double, triple, hold and release each resolve to one action in
    the card's gesture modes, so a second one would never run. ``other``
    has no gesture and may repeat. The sentence names the action that was
    already there, never ``changed`` (the one being placed).
    """
    for button in buttons:
        by_kind: dict[str, list[str]] = {}
        for action in button["actions"]:
            if action["kind"] != KIND_OTHER:
                by_kind.setdefault(action["kind"], []).append(action["action_id"])
        for kind, ids in by_kind.items():
            if len(ids) < 2:
                continue
            others = [i for i in ids if i != changed] or ids
            return f"button {button['id']} already has a {kind} event: {others[0]}"
    return None


def group_buttons(
    source: str | None,
    action_ids: list[str],
    grouping: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Group action ids into buttons; natural order, events in kind order.

    Result shape (JSON-ready, consumed by the card)::

        [{"id": "1", "label": "1",
          "actions": [{"action_id": "1_single", "event": "single",
                       "kind": "single"}, ...]}, ...]

    ``grouping`` entries for ids not in ``action_ids`` are ignored.
    """
    grouped: dict[str, list[dict[str, Any]]] = {}
    seen: set[str] = set()
    for action_id in action_ids:
        if action_id in seen:
            continue
        seen.add(action_id)
        button_id, event, kind = place_action(source, grouping, action_id)
        grouped.setdefault(button_id, []).append(
            {"action_id": action_id, "event": event, "kind": kind}
        )

    buttons = []
    for button_id in sorted(grouped, key=natural_key):
        if source == ADAPTER_DEVICE_TRIGGER:
            _promote_short_release(grouped[button_id], grouping)
        actions = sorted(
            grouped[button_id],
            key=lambda a: (_KIND_ORDER[a["kind"]], natural_key(a["event"])),
        )
        buttons.append({"id": button_id, "label": button_id, "actions": actions})
    return buttons


def _promote_short_release(
    actions: list[dict[str, Any]], grouping: dict[str, Any] | None
) -> None:
    """A button with no single and one ``short_release`` clicks on release.

    deCONZ lists the Aqara Opple and the IKEA remotes with long press,
    long release and short release but no short press: the click is the
    release. A button that has a short press keeps short release as the
    release it is. A user kind override is left alone.
    """
    if any(a["kind"] == KIND_SINGLE for a in actions):
        return
    candidates = [a for a in actions if a["event"] == "short_release"]
    if len(candidates) != 1:
        return
    override = (grouping or {}).get(candidates[0]["action_id"]) or {}
    if not override.get("kind"):
        candidates[0]["kind"] = KIND_SINGLE

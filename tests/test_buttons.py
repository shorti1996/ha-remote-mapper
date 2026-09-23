# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Tests for action-id → button grouping."""

from __future__ import annotations

from custom_components.remote_mapper.buttons import (
    event_kind,
    group_buttons,
    split_z2m_action,
)


def _ids(buttons: list[dict]) -> list[str]:
    return [b["id"] for b in buttons]


def _events(button: dict) -> list[tuple[str, str]]:
    return [(a["event"], a["kind"]) for a in button["actions"]]


def test_z2m_numbered_buttons_natural_order() -> None:
    """Lazy discovery order does not leak; 10 sorts after 2; kinds ordered."""
    buttons = group_buttons(
        "device_trigger",
        ["2_single", "10_single", "1_hold", "1_single", "1_double", "1_single"],
    )
    assert _ids(buttons) == ["1", "2", "10"]
    assert buttons[0]["label"] == "1"
    assert _events(buttons[0]) == [
        ("single", "single"),
        ("double", "double"),
        ("hold", "hold"),
    ]
    assert buttons[0]["actions"][0]["action_id"] == "1_single"


def test_z2m_named_buttons_ikea() -> None:
    """Multi-segment button names keep their prefix; bare names are buttons."""
    buttons = group_buttons(
        "z2m_mqtt",
        [
            "on",
            "off",
            "brightness_up_click",
            "brightness_up_hold",
            "brightness_up_release",
            "arrow_left_click",
        ],
    )
    by_id = {b["id"]: b for b in buttons}
    assert set(by_id) == {"on", "off", "brightness_up", "arrow_left"}
    assert _events(by_id["on"]) == [("press", "single")]
    assert _events(by_id["brightness_up"]) == [
        ("click", "single"),
        ("hold", "hold"),
        ("release", "release"),
    ]


def test_z2m_two_token_suffix_hue() -> None:
    """``on_press_release`` splits at the two-token suffix, not at ``release``."""
    buttons = group_buttons(
        "device_trigger",
        ["on_press", "on_press_release", "on_hold", "on_hold_release"],
    )
    assert _ids(buttons) == ["on"]
    assert _events(buttons[0]) == [
        ("press", "single"),
        ("hold", "hold"),
        ("hold_release", "release"),
        ("press_release", "release"),
    ]


def test_bare_events_are_one_button() -> None:
    """Aqara-style single-button remotes publish bare event tokens."""
    buttons = group_buttons("device_trigger", ["single", "double", "hold"])
    assert _ids(buttons) == ["button"]
    assert [a["action_id"] for a in buttons[0]["actions"]] == [
        "single",
        "double",
        "hold",
    ]


def test_z2m_event_first_aqara_double_rocker() -> None:
    """Aqara WXKG15LM names actions ``{event}_{button}``: three buttons."""
    buttons = group_buttons(
        "device_trigger",
        [
            f"{event}_{button}"
            for event in ("single", "double", "triple", "hold")
            for button in ("left", "right", "both")
        ],
    )
    assert _ids(buttons) == ["both", "left", "right"]
    assert _events(buttons[1]) == [
        ("single", "single"),
        ("double", "double"),
        ("triple", "triple"),
        ("hold", "hold"),
    ]
    assert buttons[1]["actions"][0]["action_id"] == "single_left"


def test_z2m_event_first_multi_token_buttons() -> None:
    """Sonoff SNZB-01M, Hue Tap, Aqara QBKG03LM: the rest is the button."""
    assert split_z2m_action("single_button_1") == ("button_1", "single")
    assert split_z2m_action("long_button_4") == ("button_4", "long")
    assert split_z2m_action("press_1_and_2") == ("1_and_2", "press")
    assert split_z2m_action("hold_release_left") == ("left", "hold_release")


def test_z2m_event_suffix_wins_over_prefix() -> None:
    """Aqara QBKG25LM mixes both orders; each id still lands on its button."""
    buttons = group_buttons(
        "device_trigger",
        ["left_single", "left_double", "single_left_center", "double_left_center"],
    )
    assert _ids(buttons) == ["left", "left_center"]
    assert [a["action_id"] for a in buttons[0]["actions"]] == [
        "left_single",
        "left_double",
    ]


def test_z2m_vendor_event_words() -> None:
    """Event words from Z2M device definitions beyond the common ones."""
    assert split_z2m_action("tripple_up") == ("up", "tripple")
    assert split_z2m_action("button_top_left_longpress") == (
        "button_top_left",
        "longpress",
    )
    assert split_z2m_action("button_top_left_longpress_release") == (
        "button_top_left",
        "longpress_release",
    )
    assert event_kind("tripple") == "triple"
    assert event_kind("held") == "hold"
    assert event_kind("released") == "release"
    buttons = group_buttons("device_trigger", ["single", "double", "many"])
    assert _ids(buttons) == ["button"]
    candeo = group_buttons("device_trigger", ["double_pressed", "held", "released"])
    assert _ids(candeo) == ["button"]


def test_unknown_suffix_is_its_own_button() -> None:
    """Nothing is hidden: unparseable ids become buttons with a press event."""
    buttons = group_buttons("mqtt_generic", ["shake", "rotate_left"])
    assert _ids(buttons) == ["rotate_left", "shake"]
    assert _events(buttons[0]) == [("press", "single")]


def test_matter_namespaced_tokens() -> None:
    """``token:event`` groups by token; Matter events classified."""
    buttons = group_buttons(
        "matter",
        [
            "button_2:multi_press_1",
            "button_1:long_press",
            "button_1:initial_press",
            "button_1:multi_press_2",
            "button_1:multi_press_1",
            "button_1:long_release",
        ],
    )
    assert _ids(buttons) == ["button_1", "button_2"]
    assert _events(buttons[0]) == [
        ("multi_press_1", "single"),
        ("multi_press_2", "double"),
        ("long_press", "hold"),
        ("long_release", "release"),
        ("initial_press", "other"),
    ]


def test_event_entity_is_single_button() -> None:
    """One event entity == one button, whatever the event names look like."""
    buttons = group_buttons("event_entity", ["multi_press_1", "long_press"])
    assert _ids(buttons) == ["button"]
    assert _events(buttons[0]) == [("multi_press_1", "single"), ("long_press", "hold")]


def test_split_and_kind_helpers() -> None:
    """Direct helper coverage for the edge cases."""
    assert split_z2m_action("1_quadruple") == ("1", "quadruple")
    assert split_z2m_action("button_1_triple") == ("button_1", "triple")
    assert split_z2m_action("toggle") == ("toggle", "press")
    assert event_kind("quadruple") == "other"
    assert event_kind("nope") == "other"


def test_empty_and_none_source() -> None:
    """No actions → no buttons; unknown source falls back to Z2M parsing."""
    assert group_buttons(None, []) == []
    assert _ids(group_buttons(None, ["1_single"])) == ["1"]

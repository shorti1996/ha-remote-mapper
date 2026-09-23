# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Grouping of every Z2M device's action list (tests/fixtures/z2m_actions.json).

The fixture comes from zigbee-herdsman-converters; scripts/z2m_actions.py
regenerates it. A failure here means a parser change regrouped real
remotes: check the diff, then ``python3 scripts/z2m_actions.py --regroup``.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from custom_components.remote_mapper.buttons import group_buttons

CATALOG = json.loads((Path(__file__).parent / "fixtures/z2m_actions.json").read_text())[
    "devices"
]


def _grouped(actions: list[str]) -> dict[str, list[str]]:
    return {
        button["id"]: [action["event"] for action in button["actions"]]
        for button in group_buttons("device_trigger", actions)
    }


@pytest.mark.parametrize(
    "device", CATALOG, ids=[f"{d['vendor']} {d['model']}" for d in CATALOG]
)
def test_grouping_matches_catalog(device: dict) -> None:
    """Buttons and their events are what the fixture recorded."""
    assert _grouped(device["actions"]) == device["buttons"]


@pytest.mark.parametrize(
    "device", CATALOG, ids=[f"{d['vendor']} {d['model']}" for d in CATALOG]
)
def test_every_action_on_exactly_one_button(device: dict) -> None:
    """Nothing is hidden or duplicated."""
    placed = [
        action["action_id"]
        for button in group_buttons("device_trigger", device["actions"])
        for action in button["actions"]
    ]
    assert sorted(placed) == sorted(device["actions"])


@pytest.mark.parametrize(
    ("model", "buttons"),
    [
        ("WXKG15LM", {"both", "left", "right"}),
        ("WXKG07LM", {"both", "left", "right"}),
        ("QBKG12LM", {"both", "left", "right"}),
        ("SNZB-01M", {"button_1", "button_2", "button_3", "button_4"}),
        ("TS0044", {"1", "2", "3", "4"}),
        ("324131092621", {"on", "up", "down", "off"}),
        ("WXKG01LM", {"button"}),
        (
            "LeTV.8KEY",
            {"up", "down", "left", "right", "center", "back", "voice", "play"},
        ),
    ],
)
def test_popular_remotes(model: str, buttons: set[str]) -> None:
    """Buttons of well-known remotes, stated by hand, not from the fixture."""
    device = next(d for d in CATALOG if d["model"] == model)
    assert set(_grouped(device["actions"])) == buttons

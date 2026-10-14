# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Action ids and grouping of every deCONZ, ZHA and Hue remote's device triggers.

The fixtures (tests/fixtures/{deconz,zha,hue}_triggers.json) come from HA's
deCONZ table, zha-quirks and the Hue v2 vocabulary; scripts/device_triggers.py
regenerates them. Each device records its ``(type, subtype)`` pairs, the
action ids the adapter makes of them and the buttons those ids group into.

A failure here means an adapter or parser change re-identified or regrouped
real remotes: check the diff, then
``uv run python scripts/device_triggers.py --regroup``.

Zigbee2MQTT has its own catalog in test_z2m_catalog.py: there the type is
always ``action`` and nothing can collapse.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from custom_components.remote_mapper.adapters.device_trigger import (
    NOT_A_BUTTON_TYPES,
    action_ids_from_triggers,
)
from custom_components.remote_mapper.buttons import group_buttons

PLATFORMS = ("deconz", "zha", "hue")


def _load(platform: str) -> list[dict]:
    path = Path(__file__).parent / f"fixtures/{platform}_triggers.json"
    return json.loads(path.read_text())["devices"]


def _name(device: dict) -> str:
    return device.get("quirk") or device["model"]


CASES = [
    pytest.param(device, id=f"{platform} {_name(device)}")
    for platform in PLATFORMS
    for device in _load(platform)
]


def _triggers(device: dict) -> list[dict]:
    return [{"type": kind, "subtype": subtype} for kind, subtype in device["triggers"]]


def _grouped(actions: list[str]) -> dict[str, list[str]]:
    return {
        button["id"]: [action["event"] for action in button["actions"]]
        for button in group_buttons("device_trigger", actions)
    }


@pytest.mark.parametrize("device", CASES)
def test_action_ids_match_catalog(device: dict) -> None:
    """The adapter derives the ids the fixture recorded from the pairs."""
    assert action_ids_from_triggers(_triggers(device)) == device["actions"]


@pytest.mark.parametrize("device", CASES)
def test_grouping_matches_catalog(device: dict) -> None:
    """Buttons and their events are what the fixture recorded."""
    assert _grouped(device["actions"]) == device["buttons"]


@pytest.mark.parametrize("device", CASES)
def test_every_action_on_exactly_one_button(device: dict) -> None:
    """Nothing is hidden or duplicated."""
    placed = [
        action["action_id"]
        for button in group_buttons("device_trigger", device["actions"])
        for action in button["actions"]
    ]
    assert sorted(placed) == sorted(device["actions"])


def _button_pairs(device: dict) -> int:
    """Pairs that stand for a button; ZHA's ``device_offline`` does not."""
    return sum(kind not in NOT_A_BUTTON_TYPES for kind, _ in device["triggers"])


def _collapses(device: dict) -> bool:
    """Whether the recorded ids are fewer than the pairs: press kinds lost."""
    return len(device["actions"]) < _button_pairs(device)


@pytest.mark.parametrize(
    "device",
    [
        pytest.param(
            case.values[0],
            id=case.id,
            marks=pytest.mark.xfail(
                _collapses(case.values[0]),
                reason="subtype-only ids collapse press kinds; "
                "ai/10-device-trigger-press-kinds.md",
                strict=True,
            ),
        )
        for case in CASES
    ],
)
def test_one_action_per_pair(device: dict) -> None:
    """Every ``(type, subtype)`` pair the platform enumerates gets its own id.

    Expected to fail wherever the fixture recorded fewer ids than pairs; the
    marks come from the fixture, so a regroup after the adapter change
    clears them by itself.
    """
    assert len(device["actions"]) == _button_pairs(device)

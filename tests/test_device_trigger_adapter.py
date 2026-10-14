# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Conformance tests for the device_trigger adapter."""

from __future__ import annotations

import pytest
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.trigger import async_validate_trigger_config

from custom_components.remote_mapper.adapters.device_trigger import (
    DeviceTriggerAdapter,
    action_ids_from_triggers,
)

from .conftest import fire_kinds_action, fire_remote_action


@pytest.fixture
def adapter() -> DeviceTriggerAdapter:
    """Fresh adapter instance (isolated probe cache)."""
    return DeviceTriggerAdapter()


async def test_default_actions(hass, remote_device, adapter) -> None:
    """Probe returns unique subtypes in discovery order."""
    actions = await adapter.async_default_actions(hass, {"device_id": remote_device})
    assert actions == ["1_single", "1_double"]


async def test_default_actions_unknown_device(
    hass, mqtt_stopped_cleanly, adapter
) -> None:
    """DeviceNotFound is wrapped, not raised."""
    actions = await adapter.async_default_actions(hass, {"device_id": "nope"})
    assert actions == []


async def test_build_trigger_conformance(hass, remote_device, adapter) -> None:
    """build_trigger output passes generic and per-platform validation."""
    config = {"device_id": remote_device}
    await adapter.async_default_actions(hass, config)  # warm probe cache

    for action_id in ("1_single", "9_hold_never_discovered"):
        trigger = adapter.build_trigger(action_id, config)
        assert trigger["subtype"] == action_id
        assert trigger["device_id"] == remote_device
        # Generic schema (list form, as automations validate)
        cv.TRIGGER_SCHEMA([trigger])
        # Real per-platform validation
        validated = await async_validate_trigger_config(hass, [trigger])
        assert validated[0]["subtype"] == action_id


async def test_subscribe_fires_and_unsubscribes(hass, remote_device, adapter) -> None:
    """Events reach the callback with action_id; unsubscribe is symmetric."""
    received: list[str] = []

    unsub = await adapter.async_subscribe(
        hass,
        {"device_id": remote_device},
        ["1_single", "1_double"],
        lambda action_id, raw: received.append(action_id),
        "Test Remote",
    )

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert received == ["1_single"]

    fire_remote_action(hass, "1_double")
    await hass.async_block_till_done()
    assert received == ["1_single", "1_double"]

    unsub()
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert received == ["1_single", "1_double"]


async def test_press_kinds_get_their_own_ids(hass, kinds_device, adapter) -> None:
    """A subtype under two types yields ``subtype:type``; under one, the subtype."""
    actions = await adapter.async_default_actions(hass, {"device_id": kinds_device})
    assert actions == [
        "turn_on:remote_button_short_press",
        "turn_on:remote_button_long_press",
        "turn_off",
    ]


async def test_press_kinds_fire_their_own_slot(hass, kinds_device, adapter) -> None:
    """A long press reaches the long id only; the card and HA agree."""
    received: list[str] = []
    unsub = await adapter.async_subscribe(
        hass,
        {"device_id": kinds_device},
        ["turn_on:remote_button_short_press", "turn_on:remote_button_long_press"],
        lambda action_id, raw: received.append(action_id),
        "Kinds Remote",
    )
    fire_kinds_action(hass, "remote_button_long_press", "turn_on")
    await hass.async_block_till_done()
    assert received == ["turn_on:remote_button_long_press"]
    fire_kinds_action(hass, "remote_button_short_press", "turn_on")
    await hass.async_block_till_done()
    assert received == [
        "turn_on:remote_button_long_press",
        "turn_on:remote_button_short_press",
    ]
    unsub()


async def test_build_trigger_carries_both_fields(hass, kinds_device, adapter) -> None:
    """A pair id round-trips to a trigger with type and subtype, probed or not."""
    config = {"device_id": kinds_device}
    await adapter.async_default_actions(hass, config)  # warm probe cache

    probed = adapter.build_trigger("turn_on:remote_button_long_press", config)
    assert (probed["type"], probed["subtype"]) == (
        "remote_button_long_press",
        "turn_on",
    )
    placeholder = adapter.build_trigger("dim_up:remote_button_double_press", config)
    assert (placeholder["type"], placeholder["subtype"]) == (
        "remote_button_double_press",
        "dim_up",
    )
    for trigger in (probed, placeholder):
        cv.TRIGGER_SCHEMA([trigger])
        validated = await async_validate_trigger_config(hass, [trigger])
        assert validated[0]["subtype"] == trigger["subtype"]
    assert adapter.build_trigger("turn_off", config)["subtype"] == "turn_off"


def test_index_triggers_pure() -> None:
    """The id rule on plain dicts: Z2M stays bare, ZHA pairs split, noise dropped."""
    triggers = [
        {"type": "action", "subtype": "1_single"},
        {"type": "action", "subtype": "1_double"},
        {"type": "remote_button_short_press", "subtype": "turn_on"},
        {"type": "remote_button_long_press", "subtype": "turn_on"},
        {"type": "device_offline", "subtype": "device_offline"},
        {"type": "button_short_press", "subtype": None},  # an entity's trigger
    ]
    assert action_ids_from_triggers(triggers) == [
        "1_single",
        "1_double",
        "turn_on:remote_button_short_press",
        "turn_on:remote_button_long_press",
    ]


async def test_subscribe_placeholder_arms_on_discovery(
    hass, remote_device, adapter
) -> None:
    """Not-yet-discovered subtype attaches as placeholder (lazy Z2M)."""
    received: list[str] = []

    unsub = await adapter.async_subscribe(
        hass,
        {"device_id": remote_device},
        ["1_single", "2_single"],  # 2_single never discovered
        lambda action_id, raw: received.append(action_id),
        "Test Remote",
    )

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert received == ["1_single"]
    unsub()


async def test_subscribe_with_foreign_entity_triggers(
    hass, remote_device, adapter
) -> None:
    """Devices expose their entities' device triggers too (no subtype).

    Regression: cloning one of those as the placeholder template injected
    a subtype into a schema that forbids it ("extra keys not allowed"),
    killing entry setup for real remotes.
    """
    from unittest.mock import patch

    from custom_components.remote_mapper.adapters import device_trigger as dt_mod

    foreign = {
        "platform": "device",
        "domain": "sensor",
        "device_id": remote_device,
        "entity_id": "abcdef0123456789",
        "type": "battery_level",
        "metadata": {},
    }
    mqtt_trigger = {
        "platform": "device",
        "domain": "mqtt",
        "device_id": remote_device,
        "type": "action",
        "subtype": "1_single",
        "metadata": {},
    }

    received: list[str] = []
    with patch.object(
        dt_mod,
        "async_get_device_automations",
        return_value={remote_device: [foreign, mqtt_trigger]},
    ):
        # foreign first — the old template picked probed[0] blindly
        unsub = await adapter.async_subscribe(
            hass,
            {"device_id": remote_device},
            ["1_single", "9_never_seen"],
            lambda action_id, raw: received.append(action_id),
            "Test Remote",
        )

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert received == ["1_single"]
    unsub()

    # default_actions must not surface the foreign trigger either
    with patch.object(
        dt_mod,
        "async_get_device_automations",
        return_value={remote_device: [foreign, mqtt_trigger]},
    ):
        actions = await adapter.async_default_actions(
            hass, {"device_id": remote_device}
        )
    assert actions == ["1_single"]


async def test_subscribe_unknown_device_raises(
    hass, mqtt_stopped_cleanly, adapter
) -> None:
    """Nothing attachable → HomeAssistantError (entry retries via NotReady)."""
    with pytest.raises(HomeAssistantError):
        await adapter.async_subscribe(
            hass, {"device_id": "nope"}, ["1_single"], lambda a, r: None, "X"
        )


async def test_default_actions_merge_z2m_exposes(hass, remote_device, adapter) -> None:
    """Z2M's exposed action enum fills in never-pressed actions, device order first."""
    import asyncio
    import json

    from pytest_homeassistant_custom_component.common import async_fire_mqtt_message

    task = hass.async_create_task(
        adapter.async_default_actions(hass, {"device_id": remote_device})
    )
    # let the probe subscribe to +/bridge/devices before the retained message
    for _ in range(10):
        await asyncio.sleep(0)
    async_fire_mqtt_message(
        hass,
        "zigbee2mqtt/bridge/devices",
        json.dumps(
            [
                {"ieee_address": "other", "definition": {"exposes": []}},
                {
                    "ieee_address": "test_remote",
                    "definition": {
                        "exposes": [
                            {"property": "battery", "type": "numeric"},
                            {
                                "property": "action",
                                "type": "enum",
                                "values": ["1_single", "1_double", "1_hold"],
                            },
                        ]
                    },
                },
            ]
        ),
    )
    assert await task == ["1_single", "1_double", "1_hold"]

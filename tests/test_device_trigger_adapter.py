"""Conformance tests for the device_trigger adapter."""

from __future__ import annotations

import pytest
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.trigger import async_validate_trigger_config

from custom_components.remote_mapper.adapters.device_trigger import (
    DeviceTriggerAdapter,
)

from .conftest import fire_remote_action


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


async def test_subscribe_unknown_device_raises(
    hass, mqtt_stopped_cleanly, adapter
) -> None:
    """Nothing attachable → HomeAssistantError (entry retries via NotReady)."""
    with pytest.raises(HomeAssistantError):
        await adapter.async_subscribe(
            hass, {"device_id": "nope"}, ["1_single"], lambda a, r: None, "X"
        )

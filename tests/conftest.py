# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Shared fixtures for Remote Mapper tests."""

from __future__ import annotations

import json
from unittest.mock import Mock

import pytest
from pytest_homeassistant_custom_component.common import async_fire_mqtt_message

REMOTE_TOPIC = "zigbee2mqtt/test_remote/action"
REMOTE_IDENTIFIER = ("mqtt", "zigbee2mqtt_test_remote")


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Enable loading custom integrations in all tests."""


@pytest.fixture(autouse=True)
def fast_z2m_exposes(monkeypatch) -> None:
    """No retained bridge/devices in tests — don't wait for it."""
    from custom_components.remote_mapper.adapters import device_trigger

    monkeypatch.setattr(device_trigger, "Z2M_EXPOSES_TIMEOUT", 0.05)


@pytest.fixture
async def mqtt_stopped_cleanly(hass, mqtt_client_mock, mqtt_mock):
    """Simulate socket close at teardown.

    PHACC's mqtt_mock leaves the client's 1s misc-loop timer scheduled
    (client.py _async_start_misc_periodic) because the mocked paho client
    never emits on_socket_close. Firing it cancels the timer — keeping
    the strict lingering-timer check active for our own timers.
    """
    yield
    # Detach automation triggers first — their MQTT unsubscribes would
    # otherwise re-arm the debouncer during hass teardown
    if hass.services.has_service("automation", "turn_off"):
        for entity_id in hass.states.async_entity_ids("automation"):
            await hass.services.async_call(
                "automation", "turn_off", {"entity_id": entity_id}, blocking=True
            )
    # Disconnect cleans the subscribe/unsubscribe debouncers
    # (EnsureJobAfterCooldown timers from mqtt/util.py)
    await mqtt_mock.async_disconnect()
    # Socket close cancels the client's misc-loop timer
    mqtt_client_mock.on_socket_close(
        mqtt_client_mock, None, Mock(fileno=Mock(return_value=-1))
    )
    await hass.async_block_till_done()
    # Anything processed above (e.g. late discovery) may have re-armed a
    # debouncer — clean once more.
    await mqtt_mock.async_disconnect()


@pytest.fixture
async def remote_device(hass, mqtt_stopped_cleanly, device_registry) -> str:
    """Publish Z2M-style device-trigger discovery; return the device id.

    Two discovered actions (1_single, 1_double). Mirrors Z2M's lazy
    discovery output: one device_automation config per action.
    """
    for action in ("1_single", "1_double"):
        config = {
            "automation_type": "trigger",
            "topic": REMOTE_TOPIC,
            "payload": action,
            "type": "action",
            "subtype": action,
            "device": {
                "identifiers": [REMOTE_IDENTIFIER[1]],
                "name": "Test Remote",
            },
        }
        async_fire_mqtt_message(
            hass,
            f"homeassistant/device_automation/test_remote/action_{action}/config",
            json.dumps(config),
        )
    await hass.async_block_till_done()

    device = device_registry.async_get_device(identifiers={REMOTE_IDENTIFIER})
    assert device is not None
    return device.id


def fire_remote_action(hass, action: str) -> None:
    """Simulate a physical button press on the synthetic remote."""
    async_fire_mqtt_message(hass, REMOTE_TOPIC, action)

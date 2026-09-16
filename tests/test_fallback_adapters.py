# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Conformance tests for the fallback adapters + drift diff."""

from __future__ import annotations

import pytest
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.trigger import async_validate_trigger_config
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_mqtt_message,
)

from custom_components.remote_mapper.adapters import get_adapter
from custom_components.remote_mapper.const import DOMAIN

from .conftest import fire_remote_action


async def test_z2m_mqtt_adapter(hass, mqtt_stopped_cleanly) -> None:
    """Raw topic: action extracted, empty action ignored, trigger valid."""
    adapter = get_adapter("z2m_mqtt")
    config = {"topic": "zigbee2mqtt/raw_remote"}
    received: list[str] = []

    assert await adapter.async_default_actions(hass, config) == []

    unsub = await adapter.async_subscribe(
        hass, config, ["1_single"], lambda a, r: received.append(a), "Raw"
    )
    async_fire_mqtt_message(hass, "zigbee2mqtt/raw_remote", '{"action": "1_single"}')
    async_fire_mqtt_message(hass, "zigbee2mqtt/raw_remote", '{"action": ""}')
    async_fire_mqtt_message(hass, "zigbee2mqtt/raw_remote", "not json")
    await hass.async_block_till_done()
    assert received == ["1_single"]
    unsub()

    trigger = adapter.build_trigger("1_single", config)
    cv.TRIGGER_SCHEMA([trigger])
    validated = await async_validate_trigger_config(hass, [trigger])
    # mqtt validation wraps payload into a Template
    assert "1_single" in str(validated[0]["payload"])


async def test_mqtt_generic_adapter(hass, mqtt_stopped_cleanly) -> None:
    """Template extraction; raw payload without template; trigger valid."""
    adapter = get_adapter("mqtt_generic")
    config = {
        "topic": "custom/buttons",
        "value_template": "{{ value_json.button }}",
    }
    received: list[str] = []

    unsub = await adapter.async_subscribe(
        hass, config, [], lambda a, r: received.append(a), "Generic"
    )
    async_fire_mqtt_message(hass, "custom/buttons", '{"button": "b1"}')
    await hass.async_block_till_done()
    assert received == ["b1"]
    unsub()

    raw_config = {"topic": "custom/raw"}
    unsub = await adapter.async_subscribe(
        hass, raw_config, [], lambda a, r: received.append(a), "Generic"
    )
    async_fire_mqtt_message(hass, "custom/raw", "pressed")
    await hass.async_block_till_done()
    assert received == ["b1", "pressed"]
    unsub()

    trigger = adapter.build_trigger("b1", config)
    validated = await async_validate_trigger_config(hass, [trigger])
    assert validated[0]["value_template"] is not None


async def test_event_entity_adapter(hass, mqtt_stopped_cleanly) -> None:
    """event_types enumeration + event_type stream + event.received trigger."""
    adapter = get_adapter("event_entity")
    entity_id = "event.remote_action"
    hass.states.async_set(
        entity_id,
        "2026-07-20T10:00:00+00:00",
        {"event_types": ["1_single", "1_double"], "event_type": None},
    )
    config = {"entity_id": entity_id}

    assert await adapter.async_default_actions(hass, config) == [
        "1_single",
        "1_double",
    ]

    received: list[str] = []
    unsub = await adapter.async_subscribe(
        hass, config, [], lambda a, r: received.append(a), "Evt"
    )
    hass.states.async_set(
        entity_id,
        "2026-07-20T10:00:01+00:00",
        {"event_types": ["1_single", "1_double"], "event_type": "1_double"},
    )
    await hass.async_block_till_done()
    assert received == ["1_double"]

    hass.states.async_set(entity_id, "unavailable", {})
    await hass.async_block_till_done()
    assert received == ["1_double"]
    unsub()

    trigger = adapter.build_trigger("1_single", config)
    assert trigger["platform"] == "event.received"
    assert trigger["options"]["event_type"] == ["1_single"]
    cv.TRIGGER_SCHEMA([trigger])


@pytest.mark.parametrize(
    "source,source_config",
    [
        ("z2m_mqtt", {"topic": "zigbee2mqtt/raw_remote"}),
        ("mqtt_generic", {"topic": "custom/raw"}),
    ],
)
async def test_fallback_entry_dispatches(
    hass, mqtt_stopped_cleanly, source, source_config
) -> None:
    """Full loop through a fallback-adapter config entry."""
    from pytest_homeassistant_custom_component.common import async_mock_service

    from custom_components.remote_mapper.store import default_slot

    calls = async_mock_service(hass, "test", "automation")
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Fallback remote",
        unique_id=f"{source}:test",
        data={
            "source": source,
            "source_config": source_config,
            "layout": {"actions": ["go"]},
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    store = hass.data[DOMAIN]["store"]
    store.async_set_slot(
        entry.entry_id,
        "go",
        {**default_slot(), "sequence": [{"action": "test.automation"}]},
    )

    payload = '{"action": "go"}' if source == "z2m_mqtt" else "go"
    async_fire_mqtt_message(hass, source_config["topic"], payload)
    await hass.async_block_till_done()
    assert len(calls) == 1


async def test_drift_diff_adds_and_flags(hass, remote_device) -> None:
    """Probe-visible new actions get added; vanished ones flagged stale."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Drift remote",
        unique_id=remote_device,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": remote_device},
            # 1_double exists in discovery but is not configured;
            # 9_gone is configured but the source never reports it
            "layout": {"actions": ["1_single", "9_gone"]},
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    store = hass.data[DOMAIN]["store"]
    remote = store.get_remote(entry.entry_id)
    assert remote["layout"]["actions"] == ["1_single", "9_gone", "1_double"]
    assert remote["stale_actions"] == ["9_gone"]

    # The added action dispatches (placeholder became a live trigger)
    from pytest_homeassistant_custom_component.common import async_mock_service

    from custom_components.remote_mapper.store import default_slot

    calls = async_mock_service(hass, "test", "automation")
    store.async_set_slot(
        entry.entry_id,
        "1_single",
        {**default_slot(), "sequence": [{"action": "test.automation"}]},
    )
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert len(calls) == 1

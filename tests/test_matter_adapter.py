# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Tests for the Matter / multi-button remote adapter + config flow.

Matter remotes expose one event.* entity per physical button; this source
groups every button of a device into one card with `{button}:{event}`
namespaced action ids.
"""

from __future__ import annotations

import pytest
from homeassistant.config_entries import SOURCE_USER
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import config_validation as cv
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_mock_service,
)

from custom_components.remote_mapper.adapters import get_adapter
from custom_components.remote_mapper.adapters.matter import button_tokens
from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.store import default_slot

EVENT_TYPES = ["multi_press_1", "multi_press_2", "long_press", "long_release"]


def _idle(hass, entity_id: str) -> None:
    hass.states.async_set(
        entity_id,
        "2026-07-20T23:40:00+00:00",
        {"event_types": EVENT_TYPES, "event_type": None, "device_class": "button"},
    )


def _fire(hass, entity_id: str, event_type: str) -> None:
    hass.states.async_set(
        entity_id,
        "2026-07-20T23:41:00+00:00",
        {"event_types": EVENT_TYPES, "event_type": event_type},
    )


@pytest.fixture
def matter_device(hass, device_registry, entity_registry):
    """Register a BILRESA-style device with one event entity per button."""
    owner = MockConfigEntry(domain="matter")
    owner.add_to_hass(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=owner.entry_id,
        identifiers={("matter", "bilresa")},
        name="BILRESA dual button green",
    )
    entity_ids = []
    for suffix in ("button_1", "button_2"):
        entry = entity_registry.async_get_or_create(
            "event",
            "matter",
            f"bilresa-{suffix}",
            device_id=device.id,
            suggested_object_id=f"bilresa_dual_button_green_{suffix}",
        )
        entity_ids.append(entry.entity_id)
    return device.id, entity_ids


def test_button_tokens_strips_shared_prefix() -> None:
    """Shared segments collapse; the last shared one stays for readability."""
    ids = [
        "event.bilresa_dual_button_green_button_1",
        "event.bilresa_dual_button_green_button_2",
    ]
    assert button_tokens(ids) == {ids[0]: "button_1", ids[1]: "button_2"}


def test_button_tokens_unique_and_total() -> None:
    """Collisions disambiguate; a lone entity still gets a token."""
    single = button_tokens(["event.remote_action"])
    assert single == {"event.remote_action": "remote_action"}
    dupes = button_tokens(["event.a_top", "event.b_top"])
    assert len(set(dupes.values())) == 2


async def test_matter_adapter_enumerate_subscribe_trigger(hass) -> None:
    """Full grid enumerated; fired button namespaced; trigger round-trips."""
    b1 = "event.bilresa_button_1"
    b2 = "event.bilresa_button_2"
    _idle(hass, b1)
    _idle(hass, b2)
    buttons = {token: eid for eid, token in button_tokens([b1, b2]).items()}
    config = {"device_id": "dev", "buttons": buttons}
    adapter = get_adapter("matter")

    actions = await adapter.async_default_actions(hass, config)
    assert actions == [f"button_1:{t}" for t in EVENT_TYPES] + [
        f"button_2:{t}" for t in EVENT_TYPES
    ]

    received: list[tuple[str, dict]] = []
    unsub = await adapter.async_subscribe(
        hass, config, actions, lambda a, r: received.append((a, r)), "Matter"
    )
    _fire(hass, b2, "long_press")
    await hass.async_block_till_done()
    assert received == [("button_2:long_press", {"entity_id": b2})]

    # unavailable is ignored, not dispatched
    hass.states.async_set(b1, "unavailable", {})
    await hass.async_block_till_done()
    assert len(received) == 1
    unsub()

    trigger = adapter.build_trigger("button_2:long_press", config)
    assert trigger["platform"] == "event.received"
    assert trigger["target"]["entity_id"] == b2
    assert trigger["options"]["event_type"] == ["long_press"]
    cv.TRIGGER_SCHEMA([trigger])


async def test_matter_flow_collects_all_buttons(hass, matter_device) -> None:
    """Menu → device pick → one entry carrying every button and event."""
    device_id, (b1, b2) = matter_device
    _idle(hass, b1)
    _idle(hass, b2)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "matter"}
    )
    assert result["step_id"] == "matter"
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"device_id": device_id}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "BILRESA dual button green"
    data = result["data"]
    assert data["source"] == "matter"
    assert data["source_config"]["buttons"] == {"button_1": b1, "button_2": b2}
    assert len(data["layout"]["actions"]) == 8
    assert data["layout"]["actions"][:4] == [f"button_1:{t}" for t in EVENT_TYPES]


async def test_matter_flow_no_event_entities(hass, device_registry) -> None:
    """A device without event entities shows an error, not an entry."""
    owner = MockConfigEntry(domain="matter")
    owner.add_to_hass(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=owner.entry_id,
        identifiers={("matter", "bare")},
        name="Bare",
    )
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "matter"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"device_id": device.id}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "no_event_entities"}


async def test_matter_entry_dispatches(hass, matter_device) -> None:
    """A namespaced action round-trips setup → press → sequence run."""
    device_id, (b1, b2) = matter_device
    _idle(hass, b1)
    _idle(hass, b2)
    calls = async_mock_service(hass, "test", "automation")

    entry = MockConfigEntry(
        domain=DOMAIN,
        title="BILRESA",
        unique_id=f"matter:{device_id}",
        data={
            "source": "matter",
            "source_config": {
                "device_id": device_id,
                "buttons": {"button_1": b1, "button_2": b2},
            },
            "layout": {"actions": ["button_1:long_press"]},
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    store = hass.data[DOMAIN]["store"]
    store.async_set_slot(
        entry.entry_id,
        "button_1:long_press",
        {**default_slot(), "sequence": [{"action": "test.automation"}]},
    )
    _fire(hass, b1, "long_press")
    await hass.async_block_till_done()
    assert len(calls) == 1

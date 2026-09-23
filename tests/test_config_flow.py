# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Tests for the device-picker config flow."""

from __future__ import annotations

from homeassistant.config_entries import SOURCE_USER
from homeassistant.data_entry_flow import FlowResultType

from custom_components.remote_mapper.const import DOMAIN


async def test_z2m_topic_flow(hass, mqtt_stopped_cleanly) -> None:
    """Manual raw-topic source creates a working entry."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "z2m_topic"}
    )
    assert result["step_id"] == "z2m_topic"
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"topic": "zigbee2mqtt/kitchen_remote", "actions": ["1_single", "1_hold"]},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "kitchen_remote"
    assert result["data"] == {
        "source": "z2m_mqtt",
        "source_config": {"topic": "zigbee2mqtt/kitchen_remote"},
        "layout": {"actions": ["1_single", "1_hold"]},
    }


async def test_full_flow(hass, remote_device) -> None:
    """Menu → device pick → probed actions (+ custom) → entry with layout."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.MENU
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "device"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "device"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"device_id": remote_device}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "actions"
    assert result["description_placeholders"]["found"] == "2"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"actions": ["1_single", "1_double", "1_hold"], "reprobe": False},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Test Remote"
    assert result["data"] == {
        "source": "device_trigger",
        "source_config": {"device_id": remote_device},
        "layout": {"actions": ["1_single", "1_double", "1_hold"]},
    }


async def test_reprobe_reshows_form(hass, remote_device) -> None:
    """Probe-again submits back to the actions form."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "device"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"device_id": remote_device}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"actions": ["1_single"], "reprobe": True}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "actions"


async def test_empty_actions_error(hass, remote_device) -> None:
    """Submitting no actions shows an error, not an entry."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "device"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"device_id": remote_device}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"actions": [], "reprobe": False}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "no_actions"}


async def test_duplicate_device_aborts(hass, remote_device) -> None:
    """Same device twice aborts (unique_id = device id)."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "device"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"device_id": remote_device}
    )
    await hass.config_entries.flow.async_configure(
        result["flow_id"], {"actions": ["1_single"], "reprobe": False}
    )
    await hass.async_block_till_done()

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "device"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"device_id": remote_device}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_retry_after_abandoned_flow(hass, remote_device) -> None:
    """A setup left open on the actions step doesn't block a second attempt."""

    async def _to_actions() -> str:
        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": SOURCE_USER}
        )
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {"next_step_id": "device"}
        )
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {"device_id": remote_device}
        )
        assert result["step_id"] == "actions"
        return result["flow_id"]

    stale = await _to_actions()
    retry = await _to_actions()
    result = await hass.config_entries.flow.async_configure(
        retry, {"actions": ["1_single"], "reprobe": False}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    # the abandoned one is gone, not left to create a duplicate
    assert stale not in {
        f["flow_id"] for f in hass.config_entries.flow.async_progress()
    }

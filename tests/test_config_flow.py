"""Tests for the device-picker config flow."""

from __future__ import annotations

from homeassistant.config_entries import SOURCE_USER
from homeassistant.data_entry_flow import FlowResultType

from custom_components.remote_mapper.const import DOMAIN


async def test_full_flow(hass, remote_device) -> None:
    """Device pick → probed actions (+ custom) → entry with layout."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

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
        result["flow_id"], {"device_id": remote_device}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"

"""Tests for the M0 config flow skeleton."""

from __future__ import annotations

from homeassistant.config_entries import SOURCE_USER
from homeassistant.data_entry_flow import FlowResultType

from custom_components.remote_mapper.const import DOMAIN


async def test_user_flow_creates_entry(hass) -> None:
    """Name-only flow creates an entry titled with the name."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Bedroom remote"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Bedroom remote"
    assert result["data"] == {}


async def test_user_flow_duplicate_aborts(hass) -> None:
    """Same name twice aborts (unique_id = slugified name)."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Bedroom remote"}
    )

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "bedroom REMOTE"}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"

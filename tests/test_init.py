"""Tests for integration setup, unload, and the WS handshake."""

from __future__ import annotations

from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.config_entries import ConfigEntryState
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.remote_mapper.const import (
    DOMAIN,
    INTEGRATION_VERSION,
    URL_BASE,
)


async def _setup_entry(hass) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="Test remote", data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_setup_and_unload_entry(hass) -> None:
    """Entry loads, registers per-entry data, and unloads cleanly."""
    entry = await _setup_entry(hass)
    assert entry.state is ConfigEntryState.LOADED
    assert entry.entry_id in hass.data[DOMAIN]

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.NOT_LOADED
    assert entry.entry_id not in hass.data[DOMAIN]


async def test_lovelace_resource_registered(hass) -> None:
    """Storage-mode Lovelace gets the card resource with a version query."""
    await _setup_entry(hass)

    resources = hass.data[LOVELACE_DATA].resources
    urls = [item["url"] for item in resources.async_items()]
    assert f"{URL_BASE}/remote-mapper-card.js?v={INTEGRATION_VERSION}" in urls


async def test_ws_ping(hass, hass_ws_client) -> None:
    """Hello-world WS command answers with the integration version."""
    await _setup_entry(hass)

    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/ping"})
    msg = await client.receive_json()

    assert msg["success"]
    assert msg["result"] == {"version": INTEGRATION_VERSION}

# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
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


async def test_reload_notification_on_new_or_changed_resource(hass) -> None:
    """A new or re-versioned card resource raises a reload notification once."""
    from homeassistant.components.persistent_notification import (
        _async_get_or_create_notifications,
    )

    from custom_components.remote_mapper.card_resource import JSModuleRegistration
    from custom_components.remote_mapper.const import RELOAD_NOTIFICATION_ID

    await _setup_entry(hass)
    notifications = _async_get_or_create_notifications(hass)
    assert RELOAD_NOTIFICATION_ID in notifications

    # dismissed + same version registered again → stays quiet
    notifications.pop(RELOAD_NOTIFICATION_ID)
    registrar = JSModuleRegistration(hass)
    assert await registrar._async_register_modules() is False
    assert RELOAD_NOTIFICATION_ID not in notifications

    # an old version on record → updated + notified again
    resources = hass.data[LOVELACE_DATA].resources
    item = next(iter(resources.async_items()))
    await resources.async_update_item(
        item["id"],
        {"res_type": "module", "url": f"{URL_BASE}/remote-mapper-card.js?v=0.0.1"},
    )
    await registrar.async_register()
    assert RELOAD_NOTIFICATION_ID in notifications
    urls = [i["url"] for i in resources.async_items()]
    assert f"{URL_BASE}/remote-mapper-card.js?v={INTEGRATION_VERSION}" in urls


async def test_ws_ping(hass, hass_ws_client) -> None:
    """Hello-world WS command answers with the integration version."""
    await _setup_entry(hass)

    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/ping"})
    msg = await client.receive_json()

    assert msg["success"]
    assert msg["result"] == {"version": INTEGRATION_VERSION}


async def _setup_device_remote(hass, device_id: str) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test Remote",
        unique_id=device_id,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": device_id},
            "layout": {"actions": ["1_single", "1_double"]},
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_stale_source_device_link_is_dropped(
    hass, remote_device, device_registry
) -> None:
    """Pre-1744afd remotes tagged the physical device with our entry: untag, keep."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test Remote",
        unique_id=remote_device,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": remote_device},
            "layout": {"actions": ["1_single"]},
        },
    )
    entry.add_to_hass(hass)
    # simulate the old model: the physical (MQTT) device also carries our entry
    device_registry.async_update_device(
        remote_device, add_config_entry_id=entry.entry_id
    )
    before = device_registry.async_get(remote_device)
    assert entry.entry_id in before.config_entries
    others = before.config_entries - {entry.entry_id}
    assert others  # the MQTT entry

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    physical = device_registry.async_get(remote_device)
    assert physical is not None, "physical device must survive"
    assert entry.entry_id not in physical.config_entries
    assert physical.config_entries == others
    assert physical.identifiers == before.identifiers
    # our own device exists and still points at the physical one
    ours = device_registry.async_get_device(identifiers={(DOMAIN, entry.entry_id)})
    assert ours is not None
    assert ours.via_device_id == remote_device


async def test_source_device_owned_only_by_us_is_kept(
    hass, remote_device, device_registry
) -> None:
    """Guard: never remove the last config entry — that would delete the device."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test Remote",
        unique_id=remote_device,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": remote_device},
            "layout": {"actions": ["1_single"]},
        },
    )
    entry.add_to_hass(hass)
    # old model link, then the MQTT entry lets go: ours is the last owner
    mqtt_entry_id = hass.config_entries.async_entries("mqtt")[0].entry_id
    device_registry.async_update_device(
        remote_device, add_config_entry_id=entry.entry_id
    )
    device_registry.async_update_device(
        remote_device, remove_config_entry_id=mqtt_entry_id
    )
    assert device_registry.async_get(remote_device).config_entries == {entry.entry_id}

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    kept = device_registry.async_get(remote_device)
    assert kept is not None, "device must not be deleted"
    assert entry.entry_id in kept.config_entries

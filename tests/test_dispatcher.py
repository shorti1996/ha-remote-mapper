"""End-to-end dispatch tests: entry setup → MQTT event → service call."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntryState
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.store import default_slot

from .conftest import fire_remote_action


async def _setup_remote_entry(hass, device_id: str) -> MockConfigEntry:
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
    assert entry.state is ConfigEntryState.LOADED
    return entry


def _assign_slot(hass, entry_id: str, action_id: str, **overrides) -> None:
    store = hass.data[DOMAIN]["store"]
    slot = {
        **default_slot(),
        "sequence": [{"action": "test.automation", "data": {"slot": action_id}}],
        **overrides,
    }
    store.async_set_slot(entry_id, action_id, slot)


async def test_assigned_slot_fires(hass, remote_device) -> None:
    """Physical event runs the assigned sequence with logbook context."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup_remote_entry(hass, remote_device)
    _assign_slot(hass, entry.entry_id, "1_single")

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()

    assert len(calls) == 1
    assert calls[0].data["slot"] == "1_single"
    assert calls[0].context is not None

    store = hass.data[DOMAIN]["store"]
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["last_run"] is not None
    assert slot["last_error"] is None


async def test_skip_matrix(hass, remote_device) -> None:
    """Empty, archived, and materialized slots never execute."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup_remote_entry(hass, remote_device)

    # Empty (no record) — 1_double stays unassigned
    fire_remote_action(hass, "1_double")
    await hass.async_block_till_done()
    assert not calls

    # Archived
    _assign_slot(hass, entry.entry_id, "1_single", archived=True)
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert not calls

    # Materialized — the generated automation owns the parallel trigger
    _assign_slot(
        hass, entry.entry_id, "1_single", materialized=True, automation_id="auto1"
    )
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert not calls


async def test_failing_sequence_never_raises(hass, remote_device) -> None:
    """Dangling target (e.g. deleted scene) → no-op + last_error, no throw."""
    entry = await _setup_remote_entry(hass, remote_device)
    _assign_slot(
        hass,
        entry.entry_id,
        "1_single",
        sequence=[{"action": "scene.turn_on", "target": {"entity_id": "scene.gone"}}],
    )

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()

    store = hass.data[DOMAIN]["store"]
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["last_error"] is not None


async def test_unload_detaches(hass, remote_device) -> None:
    """After unload the subscription is gone — symmetric detach."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup_remote_entry(hass, remote_device)
    _assign_slot(hass, entry.entry_id, "1_single")

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert not calls


async def test_device_entry_attached(hass, remote_device, device_registry) -> None:
    """Config entry is attached to the remote's registry device."""
    entry = await _setup_remote_entry(hass, remote_device)
    device = device_registry.async_get(remote_device)
    assert entry.entry_id in device.config_entries

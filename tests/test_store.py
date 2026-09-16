# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Tests for the slot store."""

from __future__ import annotations

from custom_components.remote_mapper.store import RemoteMapperStore, default_slot


async def test_roundtrip(hass) -> None:
    """Data written by one instance is loaded by the next."""
    store = RemoteMapperStore(hass)
    await store.async_load()
    store.async_ensure_remote(
        "entry1", "device_trigger", {"device_id": "dev1"}, {"actions": ["1_single"]}
    )
    store.async_set_slot(
        "entry1", "1_single", {**default_slot(), "sequence": [{"delay": "00:00:01"}]}
    )
    await store.async_flush()

    fresh = RemoteMapperStore(hass)
    await fresh.async_load()
    slot = fresh.get_slot("entry1", "1_single")
    assert slot is not None
    assert slot["sequence"] == [{"delay": "00:00:01"}]
    assert fresh.get_remote("entry1")["source"] == "device_trigger"


async def test_ensure_remote_preserves_slots(hass) -> None:
    """Re-running entry setup must not wipe slot assignments."""
    store = RemoteMapperStore(hass)
    store.async_ensure_remote("entry1", "device_trigger", {}, {"actions": ["a"]})
    store.async_set_slot("entry1", "a", default_slot())

    store.async_ensure_remote("entry1", "device_trigger", {}, {"actions": ["a", "b"]})
    assert store.get_slot("entry1", "a") is not None
    assert store.get_remote("entry1")["layout"]["actions"] == ["a", "b"]


async def test_record_run_and_clear(hass) -> None:
    """Dispatch outcomes land on the slot; clear returns it to Empty."""
    store = RemoteMapperStore(hass)
    store.async_ensure_remote("entry1", "device_trigger", {}, {})
    store.async_set_slot("entry1", "a", default_slot())

    store.async_record_run("entry1", "a", "boom")
    slot = store.get_slot("entry1", "a")
    assert slot["last_error"] == "boom"
    assert slot["last_run"] is not None

    store.async_record_run("entry1", "a", None)
    assert store.get_slot("entry1", "a")["last_error"] is None

    store.async_clear_slot("entry1", "a")
    assert store.get_slot("entry1", "a") is None

    # Recording on an Empty slot is a no-op, not an error
    store.async_record_run("entry1", "a", None)
    assert store.get_slot("entry1", "a") is None

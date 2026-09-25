# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Moving a slot to another event (remote_mapper/move_slot)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN, EVENT_UPDATED
from custom_components.remote_mapper.materializer import automation_config_id
from custom_components.remote_mapper.remote_automation import (
    remote_automation_config_id,
)
from custom_components.remote_mapper.snapshot import scene_config_id
from custom_components.remote_mapper.store import default_slot

from .conftest import fire_remote_action

SEQ_A = [{"action": "test.automation", "data": {"via": "a"}}]
SEQ_B = [{"action": "test.automation", "data": {"via": "b"}}]


@pytest.fixture(autouse=True)
def yaml_env(hass, remote_device):
    """Serve live automations.yaml and scenes.yaml to the reload services."""
    from homeassistant.util.yaml import load_yaml as _load_yaml

    automations = Path(hass.config.path("automations.yaml"))
    scenes = Path(hass.config.path("scenes.yaml"))
    automations.write_text("[]\n")
    scenes.write_text("[]\n")

    def _config(*_args, **_kwargs):
        return {
            "automation": _load_yaml(str(automations)) or [],
            "scene": _load_yaml(str(scenes)) or [],
        }

    with patch("homeassistant.config.load_yaml_config_file", side_effect=_config):
        yield
    automations.unlink(missing_ok=True)
    scenes.unlink(missing_ok=True)


async def _setup(hass, device_id: str) -> MockConfigEntry:
    assert await async_setup_component(hass, "automation", {})
    assert await async_setup_component(hass, "scene", {"scene": []})
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test Remote",
        unique_id=device_id,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": device_id},
            "layout": {"actions": ["1_single", "1_double", "2_single"]},
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _automations(hass) -> list[dict]:
    return load_yaml(hass.config.path("automations.yaml")) or []


async def _ws(client, msg: dict) -> dict:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


async def _save(client, entry, action_id: str, sequence, **extra) -> None:
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": action_id,
            "sequence": sequence,
            **extra,
        },
    )
    assert res["success"], res


async def _move(client, entry, source: str, target: str) -> dict:
    return await _ws(
        client,
        {
            "type": f"{DOMAIN}/move_slot",
            "entry_id": entry.entry_id,
            "action_id": source,
            "target_action_id": target,
        },
    )


async def test_move_plain_slot(hass, hass_ws_client, remote_device) -> None:
    """The record moves; the old event is empty; the new one runs it."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    events = async_capture_events(hass, EVENT_UPDATED)
    await _save(client, entry, "1_single", SEQ_A, name="Lamp")

    res = await _move(client, entry, "1_single", "2_single")
    assert res["success"], res
    assert res["result"] == {"moved": ["1_single"], "swapped": False}

    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(entry.entry_id, "1_single") is None
    moved = store.get_slot(entry.entry_id, "2_single")
    assert moved["sequence"] == SEQ_A
    assert moved["name"] == "Lamp"
    assert [e.data["kind"] for e in events][-1] == "slot_moved"

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert len(calls) == 0


async def test_swap_plain_slots(hass, hass_ws_client, remote_device) -> None:
    """A set target swaps: both records change places."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, entry, "1_single", SEQ_A)
    await _save(client, entry, "1_double", SEQ_B)

    res = await _move(client, entry, "1_single", "1_double")
    assert res["success"], res
    assert res["result"] == {"moved": ["1_single", "1_double"], "swapped": True}

    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(entry.entry_id, "1_single")["sequence"] == SEQ_B
    assert store.get_slot(entry.entry_id, "1_double")["sequence"] == SEQ_A


async def test_move_owned_automation(hass, hass_ws_client, remote_device) -> None:
    """An automation the card created is re-created for the new event."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, entry, "1_single", SEQ_A, materialized=True)
    old_id = automation_config_id(entry.entry_id, "1_single")
    new_id = automation_config_id(entry.entry_id, "1_double")

    res = await _move(client, entry, "1_single", "1_double")
    assert res["success"], res
    await hass.async_block_till_done()

    items = _automations(hass)
    assert [a["id"] for a in items] == [new_id]
    assert items[0]["triggers"][0]["subtype"] == "1_double"
    assert items[0]["actions"] == SEQ_A
    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(entry.entry_id, "1_single") is None
    moved = store.get_slot(entry.entry_id, "1_double")
    assert moved["materialized"] is True
    assert moved["automation_id"] == new_id
    assert old_id not in [a["id"] for a in items]


async def test_move_shared_branch(hass, hass_ws_client, remote_device) -> None:
    """A branch of the remote automation is re-keyed to the new trigger."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    store = hass.data[DOMAIN]["store"]
    await _save(client, entry, "1_single", SEQ_A)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_automation",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "scope": "remote",
        },
    )
    assert res["success"], res
    # a later-discovered event with no branch yet
    store.get_remote(entry.entry_id)["layout"]["actions"].append("1_hold")

    res = await _move(client, entry, "1_single", "1_hold")
    assert res["success"], res

    config_id = remote_automation_config_id(entry.entry_id)
    raw = next(a for a in _automations(hass) if a["id"] == config_id)
    assert sorted(t["id"] for t in raw["triggers"]) == [
        "1_double",
        "1_hold",
        "2_single",
    ]
    hold_trigger = next(t for t in raw["triggers"] if t["id"] == "1_hold")
    assert hold_trigger["subtype"] == "1_hold"
    branches = {
        b["conditions"][0]["id"]: b["sequence"] for b in raw["actions"][0]["choose"]
    }
    assert branches["1_hold"] == SEQ_A
    assert "1_single" not in branches
    assert store.get_slot(entry.entry_id, "1_single") is None
    moved = store.get_slot(entry.entry_id, "1_hold")
    assert moved["shared_automation"] is True
    assert moved["automation_id"] == config_id


async def test_swap_shared_branches(hass, hass_ws_client, remote_device) -> None:
    """Two branches exchange their actions; triggers stay in place."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, entry, "1_single", SEQ_A)
    await _save(client, entry, "1_double", SEQ_B)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_automation",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "scope": "remote",
        },
    )
    assert res["success"], res

    res = await _move(client, entry, "1_single", "1_double")
    assert res["success"], res
    assert res["result"]["swapped"] is True

    config_id = remote_automation_config_id(entry.entry_id)
    raw = next(a for a in _automations(hass) if a["id"] == config_id)
    assert [t["id"] for t in raw["triggers"]] == ["1_single", "1_double", "2_single"]
    branches = {
        b["conditions"][0]["id"]: b["sequence"] for b in raw["actions"][0]["choose"]
    }
    assert branches["1_single"] == SEQ_B
    assert branches["1_double"] == SEQ_A


async def test_move_shared_onto_plain(hass, hass_ws_client, remote_device) -> None:
    """Shared branch ↔ card-built slot: the branch is re-keyed, the record swaps."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    store = hass.data[DOMAIN]["store"]
    await _save(client, entry, "1_single", SEQ_A)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_automation",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "scope": "remote",
        },
    )
    assert res["success"], res
    # 2_single is part of the shared automation now; clear it and build a
    # plain slot there instead
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "2_single",
        },
    )
    assert res["success"], res
    await _save(client, entry, "2_single", SEQ_B)

    res = await _move(client, entry, "1_single", "2_single")
    assert res["success"], res

    config_id = remote_automation_config_id(entry.entry_id)
    raw = next(a for a in _automations(hass) if a["id"] == config_id)
    assert sorted(t["id"] for t in raw["triggers"]) == ["1_double", "2_single"]
    branches = {
        b["conditions"][0]["id"]: b["sequence"] for b in raw["actions"][0]["choose"]
    }
    assert branches["2_single"] == SEQ_A
    assert store.get_slot(entry.entry_id, "2_single")["shared_automation"] is True
    plain = store.get_slot(entry.entry_id, "1_single")
    assert plain["materialized"] is False
    assert plain["sequence"] == SEQ_B


async def test_move_snapshot_scene(hass, hass_ws_client, remote_device) -> None:
    """The owned scene follows the slot: same id, re-snapshot still works."""
    hass.states.async_set("light.a", "on", {"brightness": 120})
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "entities": ["light.a"],
        },
    )
    assert res["success"], res
    scene_id = scene_config_id(entry.entry_id, "1_single")

    res = await _move(client, entry, "1_single", "2_single")
    assert res["success"], res

    store = hass.data[DOMAIN]["store"]
    moved = store.get_slot(entry.entry_id, "2_single")
    assert moved["scene_id"] == scene_id
    assert (
        store.get_owned_scene(scene_id)["created_for"] == f"{entry.entry_id}/2_single"
    )

    hass.states.async_set("light.a", "on", {"brightness": 30})
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "2_single",
            "re_snapshot": True,
        },
    )
    assert res["success"], res
    scenes = load_yaml(hass.config.path("scenes.yaml")) or []
    assert [s["id"] for s in scenes] == [scene_id]
    assert scenes[0]["entities"]["light.a"]["brightness"] == 30


async def test_move_refusals(hass, hass_ws_client, remote_device) -> None:
    """Empty source, unknown target, same event and linked slots are refused."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    store = hass.data[DOMAIN]["store"]

    res = await _move(client, entry, "1_single", "1_double")
    assert not res["success"]
    assert "nothing to move" in res["error"]["message"]

    await _save(client, entry, "1_single", SEQ_A)
    res = await _move(client, entry, "1_single", "9_single")
    assert not res["success"]
    assert "not an event" in res["error"]["message"]

    res = await _move(client, entry, "1_single", "1_single")
    assert not res["success"]

    linked = default_slot()
    linked.update({"materialized": True, "automation_id": "native", "owned": False})
    store.async_set_slot(entry.entry_id, "1_double", linked)
    res = await _move(client, entry, "1_single", "1_double")
    assert not res["success"]
    assert "linked" in res["error"]["message"]
    assert store.get_slot(entry.entry_id, "1_single")["sequence"] == SEQ_A

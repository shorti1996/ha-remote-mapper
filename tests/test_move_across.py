# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Moving a slot to an event of another remote (move_slot + target_entry_id).

Remote A is the Z2M device-trigger remote of the fixtures; remote B is a
raw-MQTT one with its own topic and event names, so a move crosses both
the adapter and the id vocabulary.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
    async_fire_mqtt_message,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN, EVENT_UPDATED
from custom_components.remote_mapper.materializer import automation_config_id
from custom_components.remote_mapper.remote_automation import (
    remote_automation_config_id,
)
from custom_components.remote_mapper.snapshot import scene_config_id

from .conftest import fire_remote_action

SEQ_A = [{"action": "test.automation", "data": {"via": "a"}}]
SEQ_B = [{"action": "test.automation", "data": {"via": "b"}}]
TOPIC_B = "zigbee2mqtt/remote_b"


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


async def _setup(hass, device_id: str) -> tuple[MockConfigEntry, MockConfigEntry]:
    assert await async_setup_component(hass, "automation", {})
    assert await async_setup_component(hass, "scene", {"scene": []})
    a = MockConfigEntry(
        domain=DOMAIN,
        title="Remote A",
        unique_id=device_id,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": device_id},
            "layout": {"actions": ["1_single", "1_double", "2_single"]},
        },
    )
    b = MockConfigEntry(
        domain=DOMAIN,
        title="Remote B",
        unique_id="z2m_mqtt:remote_b",
        data={
            "source": "z2m_mqtt",
            "source_config": {"topic": TOPIC_B},
            "layout": {"actions": ["b_single", "b_double"]},
        },
    )
    for entry in (a, b):
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return a, b


def _automations(hass) -> dict[str, dict]:
    return {a["id"]: a for a in load_yaml(hass.config.path("automations.yaml")) or []}


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


async def _move(client, src, source: str, dst, target: str) -> dict:
    return await _ws(
        client,
        {
            "type": f"{DOMAIN}/move_slot",
            "entry_id": src.entry_id,
            "action_id": source,
            "target_action_id": target,
            "target_entry_id": dst.entry_id,
        },
    )


async def _remote_automation(client, entry, action_id: str) -> None:
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_automation",
            "entry_id": entry.entry_id,
            "action_id": action_id,
            "scope": "remote",
        },
    )
    assert res["success"], res


def _native_trigger(device_id: str, subtype: str, trigger_id: str) -> dict:
    return {
        "trigger": "device",
        "domain": "mqtt",
        "device_id": device_id,
        "type": "action",
        "subtype": subtype,
        "id": trigger_id,
    }


async def _native(hass, config_id: str, payload: dict) -> None:
    from custom_components.remote_mapper.materializer import _get_config_store

    await _get_config_store(hass).async_upsert(config_id, payload)
    await hass.async_block_till_done()


async def _link(hass, entry, action_id: str, config_id: str) -> None:
    from custom_components.remote_mapper.materializer import async_link

    await async_link(
        hass, hass.data[DOMAIN]["store"], entry.entry_id, action_id, config_id
    )


def _press_b(hass, action: str) -> None:
    async_fire_mqtt_message(hass, TOPIC_B, f'{{"action": "{action}"}}')


async def test_plain_across(hass, hass_ws_client, remote_device) -> None:
    """The record changes remote; only the new remote's press runs it."""
    calls = async_mock_service(hass, "test", "automation")
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    events = async_capture_events(hass, EVENT_UPDATED)
    await _save(client, a, "1_single", SEQ_A, name="Lamp")

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    assert res["result"] == {
        "moved": ["1_single"],
        "swapped": False,
        "entries": [a.entry_id, b.entry_id],
    }
    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(a.entry_id, "1_single") is None
    moved = store.get_slot(b.entry_id, "b_single")
    assert moved["sequence"] == SEQ_A
    assert moved["name"] == "Lamp"
    updated = [(e.data["entry_id"], e.data["kind"]) for e in events][-2:]
    assert sorted(updated) == sorted(
        [(a.entry_id, "slot_moved"), (b.entry_id, "slot_moved")]
    )

    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert calls == []
    _press_b(hass, "b_single")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["a"]


async def test_swap_across(hass, hass_ws_client, remote_device) -> None:
    """A set target swaps across the two remotes."""
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, a, "1_single", SEQ_A)
    await _save(client, b, "b_double", SEQ_B)

    res = await _move(client, a, "1_single", b, "b_double")
    assert res["success"], res
    assert res["result"]["swapped"] is True
    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(a.entry_id, "1_single")["sequence"] == SEQ_B
    assert store.get_slot(b.entry_id, "b_double")["sequence"] == SEQ_A


async def test_owned_automation_across(hass, hass_ws_client, remote_device) -> None:
    """The card's automation is re-created with the other remote's trigger."""
    calls = async_mock_service(hass, "test", "automation")
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, a, "1_single", SEQ_A, materialized=True)
    old_id = automation_config_id(a.entry_id, "1_single")
    assert old_id in _automations(hass)

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    new_id = automation_config_id(b.entry_id, "b_single")
    items = _automations(hass)
    assert old_id not in items
    raw = items[new_id]
    assert raw["triggers"][0]["topic"] == TOPIC_B
    assert raw["triggers"][0]["payload"] == "b_single"
    assert "Remote B" in raw["alias"]
    moved = hass.data[DOMAIN]["store"].get_slot(b.entry_id, "b_single")
    assert moved["automation_id"] == new_id
    assert moved["materialized"] is True

    _press_b(hass, "b_single")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["a"]


async def test_disabled_owned_stays_off(hass, hass_ws_client, remote_device) -> None:
    """A disabled event arrives disabled: its new automation is off."""
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, a, "1_single", SEQ_A, materialized=True)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/archive_slot",
            "entry_id": a.entry_id,
            "action_id": "1_single",
            "archived": True,
        },
    )
    assert res["success"], res

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    moved = hass.data[DOMAIN]["store"].get_slot(b.entry_id, "b_single")
    assert moved["archived"] is True
    from custom_components.remote_mapper.materializer import automation_entity_id

    state = hass.states.get(automation_entity_id(hass, moved["automation_id"]))
    assert state.state == "off"


async def test_shared_branch_lands_in_card(hass, hass_ws_client, remote_device):
    """B has no shared automation: the branch's actions run from the card."""
    calls = async_mock_service(hass, "test", "automation")
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, a, "1_single", SEQ_A)
    await _remote_automation(client, a, "1_single")

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    store = hass.data[DOMAIN]["store"]
    moved = store.get_slot(b.entry_id, "b_single")
    assert moved["materialized"] is False
    assert moved["shared_automation"] is False
    assert moved["sequence"] == SEQ_A
    raw = _automations(hass)[remote_automation_config_id(a.entry_id)]
    assert sorted(t["id"] for t in raw["triggers"]) == ["1_double", "2_single"]
    assert remote_automation_config_id(b.entry_id) not in _automations(hass)

    _press_b(hass, "b_single")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["a"]


async def test_shared_branch_joins_other_automation(
    hass, hass_ws_client, remote_device
) -> None:
    """B has a shared automation: the branch becomes a branch there."""
    calls = async_mock_service(hass, "test", "automation")
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, a, "1_single", SEQ_A)
    await _remote_automation(client, a, "1_single")
    await _save(client, b, "b_double", SEQ_B)
    await _remote_automation(client, b, "b_double")
    # b_single got an empty branch at creation; drop it so the move adds one
    store = hass.data[DOMAIN]["store"]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": b.entry_id,
            "action_id": "b_single",
            "decision": "delete",
        },
    )
    assert res["success"], res

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    config_id = remote_automation_config_id(b.entry_id)
    moved = store.get_slot(b.entry_id, "b_single")
    assert moved["shared_automation"] is True
    assert moved["automation_id"] == config_id
    raw = _automations(hass)[config_id]
    assert sorted(t["id"] for t in raw["triggers"]) == ["b_double", "b_single"]
    branches = {
        o["conditions"][0]["id"]: o["sequence"] for o in raw["actions"][0]["choose"]
    }
    assert branches["b_single"] == SEQ_A

    _press_b(hass, "b_single")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["a"]


async def test_linked_flat_across(hass, hass_ws_client, remote_device) -> None:
    """A linked one-trigger automation gets the other remote's trigger."""
    calls = async_mock_service(hass, "test", "automation")
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _native(
        hass,
        "native_flat",
        {
            "alias": "Toggle kitchen",
            "triggers": [_native_trigger(remote_device, "1_single", "single")],
            "actions": SEQ_A,
        },
    )
    await _link(hass, a, "1_single", "native_flat")

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    raw = _automations(hass)["native_flat"]
    assert raw["triggers"] == [
        {
            "platform": "mqtt",
            "topic": TOPIC_B,
            "value_template": "{{ value_json.action }}",
            "payload": "b_single",
            "id": "b_single",
        }
    ]
    assert raw["actions"] == SEQ_A
    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(a.entry_id, "1_single") is None
    moved = store.get_slot(b.entry_id, "b_single")
    assert moved["automation_id"] == "native_flat"
    assert moved["owned"] is False

    _press_b(hass, "b_single")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["a"]


async def test_linked_refusals(hass, hass_ws_client, remote_device) -> None:
    """A per-remote automation, or a flat one with more triggers, stays put."""
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _native(
        hass,
        "native_branch",
        {
            "alias": "Kitchen remote",
            "triggers": [
                _native_trigger(remote_device, "1_single", "single"),
                _native_trigger(remote_device, "1_double", "double"),
            ],
            "actions": [
                {
                    "choose": [
                        {
                            "conditions": [{"condition": "trigger", "id": "single"}],
                            "sequence": SEQ_A,
                        },
                        {
                            "conditions": [{"condition": "trigger", "id": "double"}],
                            "sequence": SEQ_B,
                        },
                    ]
                }
            ],
        },
    )
    await _native(
        hass,
        "native_wide",
        {
            "alias": "Any button",
            "triggers": [
                _native_trigger(remote_device, "2_single", "two"),
                _native_trigger(remote_device, "1_double", "double"),
            ],
            "actions": SEQ_A,
        },
    )
    await _link(hass, a, "1_single", "native_branch")
    await _link(hass, a, "2_single", "native_wide")
    before = _automations(hass)
    store = hass.data[DOMAIN]["store"]

    res = await _move(client, a, "1_single", b, "b_single")
    assert not res["success"]
    assert "one branch per event" in res["error"]["message"]
    res = await _move(client, a, "2_single", b, "b_single")
    assert not res["success"]
    assert "other events" in res["error"]["message"]

    # a swap whose other direction is refused changes nothing either
    await _save(client, b, "b_double", SEQ_B)
    res = await _move(client, b, "b_double", a, "1_single")
    assert not res["success"]
    assert _automations(hass) == before
    assert store.get_slot(a.entry_id, "1_single")["automation_id"] == "native_branch"
    assert store.get_slot(b.entry_id, "b_double")["sequence"] == SEQ_B
    assert store.get_slot(b.entry_id, "b_single") is None


async def test_scene_across(hass, hass_ws_client, remote_device) -> None:
    """The owned scene keeps its id, is owned by the new event, and
    survives the old remote's removal."""
    hass.states.async_set("light.a", "on", {"brightness": 120})
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": a.entry_id,
            "action_id": "1_single",
            "entities": ["light.a"],
        },
    )
    assert res["success"], res
    scene_id = scene_config_id(a.entry_id, "1_single")

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    store = hass.data[DOMAIN]["store"]
    moved = store.get_slot(b.entry_id, "b_single")
    assert moved["scene_id"] == scene_id
    assert store.get_owned_scene(scene_id)["created_for"] == f"{b.entry_id}/b_single"
    assert store.owned_scenes_for(a.entry_id) == []

    hass.states.async_set("light.a", "on", {"brightness": 30})
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": b.entry_id,
            "action_id": "b_single",
            "re_snapshot": True,
        },
    )
    assert res["success"], res
    scenes = load_yaml(hass.config.path("scenes.yaml")) or []
    assert [s["id"] for s in scenes] == [scene_id]
    assert scenes[0]["entities"]["light.a"]["brightness"] == 30

    hass.config_entries.async_update_entry(
        a, options={"owned_scene_cleanup": "always_delete"}
    )
    await hass.config_entries.async_remove(a.entry_id)
    await hass.async_block_till_done()
    scenes = load_yaml(hass.config.path("scenes.yaml")) or []
    assert [s["id"] for s in scenes] == [scene_id]
    assert store.get_owned_scene(scene_id) is not None


async def test_import_trail_stays_behind(hass, hass_ws_client, remote_device) -> None:
    """The original A disabled is A's to turn back on, not B's."""
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _native(
        hass,
        "native_flat",
        {
            "alias": "Toggle kitchen",
            "triggers": [_native_trigger(remote_device, "1_single", "single")],
            "actions": SEQ_A,
        },
    )
    await _link(hass, a, "1_single", "native_flat")
    # untick the link: the actions are absorbed, the original goes off
    await _save(client, a, "1_single", SEQ_A, materialized=False)
    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(a.entry_id, "1_single")["imported_from"]
    assert hass.states.get("automation.toggle_kitchen").state == "off"

    res = await _move(client, a, "1_single", b, "b_single")
    assert res["success"], res
    moved = store.get_slot(b.entry_id, "b_single")
    assert "imported_from" not in moved
    assert moved["sequence"] == SEQ_A
    assert [o["config_id"] for o in store.disabled_originals(a.entry_id)] == [
        "native_flat"
    ]

    from custom_components.remote_mapper.release import async_reenable_imported

    assert await async_reenable_imported(hass, store, b.entry_id) == []
    assert hass.states.get("automation.toggle_kitchen").state == "off"
    assert await async_reenable_imported(hass, store, a.entry_id) == [
        "automation.toggle_kitchen"
    ]
    assert hass.states.get("automation.toggle_kitchen").state == "on"


async def test_target_refusals(hass, hass_ws_client, remote_device) -> None:
    """Unknown target remote, unknown event and an empty source are refused."""
    a, b = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _save(client, a, "1_single", SEQ_A)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/move_slot",
            "entry_id": a.entry_id,
            "action_id": "1_single",
            "target_action_id": "b_single",
            "target_entry_id": "nope",
        },
    )
    assert not res["success"]
    assert res["error"]["code"] == "not_found"
    res = await _move(client, a, "1_single", b, "9_single")
    assert not res["success"]
    assert "not an event of the other remote" in res["error"]["message"]
    res = await _move(client, a, "1_double", b, "b_single")
    assert not res["success"]
    assert "nothing to move" in res["error"]["message"]
    assert hass.data[DOMAIN]["store"].get_slot(a.entry_id, "1_single")["sequence"] == (
        SEQ_A
    )

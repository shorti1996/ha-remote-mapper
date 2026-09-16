"""Per-remote shared automation ("Shape A") — plan ai/06."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.remote_automation import (
    branch_view,
    build_remote_payload,
    find_branch,
    remote_automation_config_id,
)
from custom_components.remote_mapper.store import default_slot

from .conftest import fire_remote_action

SEQ = [{"action": "test.automation", "data": {"via": "slot"}}]


@pytest.fixture(autouse=True)
def automation_yaml_env(hass, remote_device):
    """Serve the real automations.yaml to automation.reload (see test_materializer)."""
    from homeassistant.util.yaml import load_yaml as _load_yaml

    path = Path(hass.config.path("automations.yaml"))
    path.write_text("[]\n")

    def _config(*_args, **_kwargs):
        return {"automation": _load_yaml(str(path)) or []}

    with patch("homeassistant.config.load_yaml_config_file", side_effect=_config):
        yield
    path.unlink(missing_ok=True)


async def _setup(hass, device_id: str) -> MockConfigEntry:
    assert await async_setup_component(hass, "automation", {})
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


def _yaml(hass) -> list[dict]:
    return load_yaml(hass.config.path("automations.yaml")) or []


async def _ws(client, msg: dict) -> dict:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


def _shared(hass, entry) -> dict:
    config_id = remote_automation_config_id(entry.entry_id)
    return next(a for a in _yaml(hass) if a["id"] == config_id)


# ── pure helpers ──────────────────────────────────────────────────


def test_payload_shape() -> None:
    """One trigger with id + one trigger-keyed branch per event, in order."""
    payload = build_remote_payload(
        "Pilot",
        {"a": {"platform": "mqtt", "topic": "t", "payload": "a"}, "b": {"platform": "mqtt", "topic": "t", "payload": "b"}},
        {"b": SEQ},
    )
    assert [t["id"] for t in payload["triggers"]] == ["a", "b"]
    branches = payload["actions"][0]["choose"]
    assert branches[0] == {"conditions": [{"condition": "trigger", "id": "a"}], "sequence": []}
    assert branches[1]["sequence"] == SEQ
    assert payload["mode"] == "parallel"
    assert find_branch(payload, "b") == 1
    assert branch_view(payload, "b") == {"actions": SEQ, "branch_missing": False}
    assert branch_view(payload, "zzz") == {"actions": [], "branch_missing": True}


def test_branch_resolves_after_id_rename() -> None:
    """User renamed the trigger id in HA: the intrinsic match still finds it."""
    payload = build_remote_payload(
        "Pilot",
        {"1_single": {"platform": "device", "domain": "mqtt", "type": "action", "subtype": "1_single"}},
        {"1_single": SEQ},
    )
    payload["triggers"][0]["id"] = "tap"
    payload["actions"][0]["choose"][0]["conditions"][0]["id"] = "tap"
    assert branch_view(payload, "1_single") == {"actions": SEQ, "branch_missing": False}


def test_non_shape_a_is_left_alone() -> None:
    """A choose over something else than trigger ids is not our shape."""
    payload = {
        "triggers": [{"platform": "state", "entity_id": "x"}],
        "actions": [{"choose": [{"conditions": [{"condition": "time", "after": "10:00"}], "sequence": SEQ}]}],
    }
    assert branch_view(payload, "0") is None


# ── flows ─────────────────────────────────────────────────────────


async def test_create_for_whole_remote(hass, hass_ws_client, remote_device) -> None:
    """Scope=remote scaffolds every event; card-built sequences move in."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    slot = default_slot()
    slot["sequence"] = SEQ
    store.async_set_slot(entry.entry_id, "1_double", slot)
    client = await hass_ws_client(hass)

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
    config_id = remote_automation_config_id(entry.entry_id)
    assert res["result"]["config_id"] == config_id
    assert res["result"]["edit_url"] == f"/config/automation/edit/{config_id}"

    raw = _shared(hass, entry)
    assert [t["id"] for t in raw["triggers"]] == ["1_single", "1_double"]
    branches = raw["actions"][0]["choose"]
    assert branches[0]["sequence"] == []
    assert branches[1]["sequence"] == SEQ

    for action_id in ("1_single", "1_double"):
        slot = store.get_slot(entry.entry_id, action_id)
        assert slot["materialized"] is True
        assert slot["shared_automation"] is True
        assert slot["automation_id"] == config_id
        assert slot["sequence"] == []

    # the automation fires the branch itself; the dispatcher skips
    fire_remote_action(hass, "1_double")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["slot"]

    # get_remote: shared automation advertised, per-slot live branch
    res = await _ws(client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id})
    assert res["result"]["remote_automation"]["config_id"] == config_id
    assert res["result"]["slots"]["1_double"]["live_actions"] == SEQ
    assert res["result"]["slots"]["1_single"]["live_actions"] == []
    assert res["result"]["slots"]["1_single"]["branch_missing"] is False

    # get_slot: narrowed live view
    res = await _ws(
        client,
        {"type": f"{DOMAIN}/get_slot", "entry_id": entry.entry_id, "action_id": "1_double"},
    )
    assert res["result"]["live"]["branch"] is True
    assert res["result"]["live"]["actions"] == SEQ


async def test_grow_clear_and_delete_on_last(hass, hass_ws_client, remote_device) -> None:
    """Add a branch after refresh; clear removes it; last clear deletes."""
    entry = await _setup(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    client = await hass_ws_client(hass)
    config_id = remote_automation_config_id(entry.entry_id)

    res = await _ws(
        client,
        {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_single", "scope": "remote"},
    )
    assert res["success"], res

    # a later-discovered event
    remote = store.get_remote(entry.entry_id)
    remote["layout"]["actions"].append("1_hold")
    res = await _ws(
        client,
        {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_hold", "scope": "remote"},
    )
    assert res["success"], res
    raw = _shared(hass, entry)
    assert [t["id"] for t in raw["triggers"]] == ["1_single", "1_double", "1_hold"]
    assert len(raw["actions"][0]["choose"]) == 3
    assert store.get_slot(entry.entry_id, "1_hold")["shared_automation"] is True

    # clear one: branch + trigger gone, the automation stays
    res = await _ws(
        client,
        {"type": f"{DOMAIN}/clear_slot", "entry_id": entry.entry_id, "action_id": "1_double"},
    )
    assert res["success"], res
    raw = _shared(hass, entry)
    assert [t["id"] for t in raw["triggers"]] == ["1_single", "1_hold"]
    assert [b["conditions"][0]["id"] for b in raw["actions"][0]["choose"]] == ["1_single", "1_hold"]
    assert store.get_slot(entry.entry_id, "1_double") is None

    # clear the rest: the automation is deleted with its last branch
    for action_id in ("1_single", "1_hold"):
        res = await _ws(
            client,
            {"type": f"{DOMAIN}/clear_slot", "entry_id": entry.entry_id, "action_id": action_id},
        )
        assert res["success"], res
    assert all(a["id"] != config_id for a in _yaml(hass))


async def test_branch_missing_and_readd(hass, hass_ws_client, remote_device) -> None:
    """User deleted a branch in HA → flagged; scope=remote re-adds it."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    config_id = remote_automation_config_id(entry.entry_id)
    await _ws(
        client,
        {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_single", "scope": "remote"},
    )

    # external edit: drop the 1_double branch (trigger left in place)
    from custom_components.remote_mapper.materializer import _get_config_store

    config_store = _get_config_store(hass)
    raw = await config_store.async_get(config_id)
    payload = {k: v for k, v in raw.items() if k != "id"}
    payload["actions"][0]["choose"] = payload["actions"][0]["choose"][:1]
    await config_store.async_upsert(config_id, payload)

    res = await _ws(client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id})
    assert res["result"]["slots"]["1_double"]["branch_missing"] is True
    assert res["result"]["slots"]["1_single"]["branch_missing"] is False

    res = await _ws(
        client,
        {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_double", "scope": "remote"},
    )
    assert res["success"], res
    raw = _shared(hass, entry)
    assert [b["conditions"][0]["id"] for b in raw["actions"][0]["choose"]] == ["1_single", "1_double"]
    # the trigger was still there — not duplicated
    assert [t["id"] for t in raw["triggers"]] == ["1_single", "1_double"]


async def test_save_edits_branch_and_untick_detaches(hass, hass_ws_client, remote_device) -> None:
    """YAML save on a shared slot edits its branch; unticking pulls it back."""
    entry = await _setup(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    client = await hass_ws_client(hass)
    config_id = remote_automation_config_id(entry.entry_id)
    await _ws(
        client,
        {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_single", "scope": "remote"},
    )

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
            "name": "Tap",
        },
    )
    assert res["success"], res
    raw = _shared(hass, entry)
    assert raw["actions"][0]["choose"][0]["sequence"] == SEQ
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["shared_automation"] is True and slot["name"] == "Tap"
    # no per-slot automation was created on the side
    assert [a["id"] for a in _yaml(hass)] == [config_id]

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "materialized": False,
        },
    )
    assert res["success"], res
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["materialized"] is False
    assert slot["shared_automation"] is False
    assert slot["sequence"] == SEQ
    raw = _shared(hass, entry)  # still there for 1_double
    assert [t["id"] for t in raw["triggers"]] == ["1_double"]


async def test_button_scope_creates_empty_shell(hass, hass_ws_client, remote_device) -> None:
    """Scope=button: own automation with the trigger and no actions."""
    entry = await _setup(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_automation",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "scope": "button",
            "name": "Desk lamp",
        },
    )
    assert res["success"], res
    config_id = res["result"]["config_id"]
    raw = next(a for a in _yaml(hass) if a["id"] == config_id)
    assert raw["actions"] == []
    assert raw["triggers"][0]["subtype"] == "1_single"
    assert "Desk lamp" in raw["alias"]
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["materialized"] is True and slot["owned"] is True
    assert not slot.get("shared_automation")

    # a second call on the same event is refused, nothing duplicated
    res = await _ws(
        client,
        {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_single", "scope": "button"},
    )
    assert not res["success"]


async def test_release_unmanages_shared_once(hass, hass_ws_client, remote_device) -> None:
    """Hand-back strips our prefix from the shared automation exactly once."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    config_id = remote_automation_config_id(entry.entry_id)
    await _ws(
        client,
        {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_single", "scope": "remote"},
    )

    res = await _ws(
        client,
        {"type": f"{DOMAIN}/release_remote", "entry_id": entry.entry_id, "convert_remaining": True},
    )
    assert res["success"], res
    assert sorted(res["result"]["kept"]) == ["1_double", "1_single"]
    raw = next(a for a in _yaml(hass) if a["id"] == config_id)
    assert raw["alias"] == "Test Remote"
    assert len(raw["actions"][0]["choose"]) == 2


async def test_snapshot_on_shared_slot_lands_in_branch(hass, hass_ws_client, remote_device) -> None:
    """Scene from current state on a branch slot: the branch calls the scene."""
    from homeassistant.util.yaml import load_yaml as _load_yaml

    scenes = Path(hass.config.path("scenes.yaml"))
    scenes.write_text("[]\n")
    automations = Path(hass.config.path("automations.yaml"))

    def _config(*_args, **_kwargs):
        return {
            "automation": _load_yaml(str(automations)) or [],
            "scene": _load_yaml(str(scenes)) or [],
        }

    # serve both yaml stores (the module fixture serves automations only)
    with patch("homeassistant.config.load_yaml_config_file", side_effect=_config):
        try:
            assert await async_setup_component(hass, "scene", {"scene": []})
            hass.states.async_set("light.a", "on")
            entry = await _setup(hass, remote_device)
            store = hass.data[DOMAIN]["store"]
            client = await hass_ws_client(hass)
            await _ws(
                client,
                {"type": f"{DOMAIN}/create_automation", "entry_id": entry.entry_id, "action_id": "1_single", "scope": "remote"},
            )
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
            slot = store.get_slot(entry.entry_id, "1_single")
            assert slot["shared_automation"] is True and slot["sequence"] == []
            assert slot["scene_id"]
            branch = _shared(hass, entry)["actions"][0]["choose"][0]["sequence"]
            assert branch[0]["action"] == "scene.turn_on"
        finally:
            scenes.unlink(missing_ok=True)

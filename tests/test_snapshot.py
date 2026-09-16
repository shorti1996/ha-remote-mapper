# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Snapshot flow + scene ownership + clear policy tests."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.snapshot import scene_config_id
from custom_components.remote_mapper.store import default_slot


@pytest.fixture(autouse=True)
def scene_yaml_env(hass, remote_device):
    """Serve live scenes.yaml through the patched config loader.

    Same trick as the materializer tests: mqtt_mock's mock_hass_config
    stubs load_yaml_config_file, so scene.reload would see nothing.
    """
    from homeassistant.util.yaml import load_yaml as _load_yaml

    path = Path(hass.config.path("scenes.yaml"))
    path.write_text("[]\n")

    def _config(*_args, **_kwargs):
        return {"scene": _load_yaml(str(path)) or []}

    with patch("homeassistant.config.load_yaml_config_file", side_effect=_config):
        yield
    path.unlink(missing_ok=True)


async def _setup(hass, device_id: str, **entry_kwargs) -> MockConfigEntry:
    assert await async_setup_component(hass, "scene", {"scene": []})
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test Remote",
        unique_id=device_id,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": device_id},
            "layout": {"actions": ["1_single", "1_double"]},
        },
        **entry_kwargs,
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _scenes_yaml(hass) -> list[dict]:
    path = Path(hass.config.path("scenes.yaml"))
    if not path.exists():
        return []
    return load_yaml(str(path)) or []


async def _ws(client, msg: dict) -> dict:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


async def test_snapshot_creates_scene_and_binding(
    hass, hass_ws_client, remote_device
) -> None:
    """Default entity set captured into a persistent scene + slot binding."""
    hass.states.async_set("light.a", "on", {"brightness": 120})
    hass.states.async_set("light.b", "off")
    entry = await _setup(
        hass,
        remote_device,
        options={"snapshot_entities": ["light.a", "light.b"]},
    )
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "name": "Evening",
        },
    )
    assert res["success"], res
    scene_id = scene_config_id(entry.entry_id, "1_single")
    assert res["result"]["scene_id"] == scene_id
    scene_entity = res["result"]["scene_entity_id"]
    assert scene_entity.startswith("scene.")

    scenes = _scenes_yaml(hass)
    assert len(scenes) == 1
    assert scenes[0]["id"] == scene_id
    assert scenes[0]["name"] == "Evening"
    assert scenes[0]["entities"]["light.a"]["state"] == "on"
    assert scenes[0]["entities"]["light.a"]["brightness"] == 120
    assert scenes[0]["entities"]["light.b"]["state"] == "off"

    store = hass.data[DOMAIN]["store"]
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["scene_id"] == scene_id
    assert slot["sequence"] == [
        {"action": "scene.turn_on", "target": {"entity_id": scene_entity}}
    ]
    owned = store.get_owned_scene(scene_id)
    assert owned["created_for"] == f"{entry.entry_id}/1_single"
    assert owned["entities"] == ["light.a", "light.b"]


async def test_re_snapshot_in_place(hass, hass_ws_client, remote_device) -> None:
    """Same scene id + entity set, new states — no versioned clutter."""
    hass.states.async_set("light.a", "on", {"brightness": 120})
    entry = await _setup(
        hass, remote_device, options={"snapshot_entities": ["light.a"]}
    )
    client = await hass_ws_client(hass)

    await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )

    # Options change must NOT affect re-snapshot (owned set is canonical)
    hass.config_entries.async_update_entry(
        entry, options={"snapshot_entities": ["light.zzz"]}
    )
    hass.states.async_set("light.a", "on", {"brightness": 30})

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "re_snapshot": True,
        },
    )
    assert res["success"], res

    scenes = _scenes_yaml(hass)
    assert len(scenes) == 1
    assert scenes[0]["entities"]["light.a"]["brightness"] == 30
    store = hass.data[DOMAIN]["store"]
    owned = store.get_owned_scene(scene_config_id(entry.entry_id, "1_single"))
    assert owned["entities"] == ["light.a"]


async def test_clear_ask_then_remember(hass, hass_ws_client, remote_device) -> None:
    """ask → dialog; delete+remember persists always_delete; next clear silent."""
    hass.states.async_set("light.a", "on")
    entry = await _setup(
        hass, remote_device, options={"snapshot_entities": ["light.a"]}
    )
    client = await hass_ws_client(hass)

    for action_id in ("1_single", "1_double"):
        await _ws(
            client,
            {
                "type": f"{DOMAIN}/create_snapshot",
                "entry_id": entry.entry_id,
                "action_id": action_id,
            },
        )
    assert len(_scenes_yaml(hass)) == 2

    # First clear: needs decision
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["result"]["needs_decision"] is True
    assert "scene" in res["result"]["artifacts"]
    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(entry.entry_id, "1_single") is not None  # true no-op

    # Decide delete + remember
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "decision": "delete",
            "remember": True,
        },
    )
    assert res["success"]
    assert len(_scenes_yaml(hass)) == 1
    assert store.get_slot(entry.entry_id, "1_single") is None
    assert entry.options["owned_scene_cleanup"] == "always_delete"

    # Second clear: silent (remembered)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
        },
    )
    assert res["success"]
    assert "needs_decision" not in res["result"]
    assert _scenes_yaml(hass) == []


async def test_clear_keep_drops_ownership_only(
    hass, hass_ws_client, remote_device
) -> None:
    """keep → scene survives as hand-made; registry entry gone."""
    hass.states.async_set("light.a", "on")
    entry = await _setup(
        hass, remote_device, options={"snapshot_entities": ["light.a"]}
    )
    client = await hass_ws_client(hass)
    await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "decision": "keep",
        },
    )
    assert res["success"]
    assert len(_scenes_yaml(hass)) == 1  # scene untouched
    store = hass.data[DOMAIN]["store"]
    assert store.get_owned_scene(scene_config_id(entry.entry_id, "1_single")) is None
    assert store.get_slot(entry.entry_id, "1_single") is None


async def test_clear_handmade_scene_no_dialog(
    hass, hass_ws_client, remote_device
) -> None:
    """Hand-made scene assigned to a slot: pointer removed, scene untouched."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    store = hass.data[DOMAIN]["store"]
    slot = {
        **default_slot(),
        "sequence": [
            {"action": "scene.turn_on", "target": {"entity_id": "scene.handmade"}}
        ],
        "scene_id": None,  # hand-made scenes never get a scene_id pointer
    }
    store.async_set_slot(entry.entry_id, "1_single", slot)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["success"]
    assert "needs_decision" not in res["result"]
    assert store.get_slot(entry.entry_id, "1_single") is None


async def test_entry_removal_bulk_cleanup(hass, hass_ws_client, remote_device) -> None:
    """always_delete removes owned scenes on entry removal; ask keeps them."""
    hass.states.async_set("light.a", "on")
    entry = await _setup(
        hass,
        remote_device,
        options={
            "snapshot_entities": ["light.a"],
            "owned_scene_cleanup": "always_delete",
        },
    )
    client = await hass_ws_client(hass)
    await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert len(_scenes_yaml(hass)) == 1

    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert _scenes_yaml(hass) == []
    store = hass.data[DOMAIN]["store"]
    assert store.get_remote(entry.entry_id) is None
    assert store.data["owned_scenes"] == {}


async def test_snapshot_with_explicit_entities_remembers_default(
    hass, hass_ws_client, remote_device
) -> None:
    """Card-picked entities win; remember_entities writes the remote default."""
    hass.states.async_set("light.a", "on")
    hass.states.async_set("light.c", "off")
    entry = await _setup(
        hass, remote_device, options={"snapshot_entities": ["light.a"]}
    )
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "entities": ["light.c"],
            "remember_entities": True,
        },
    )
    assert res["success"], res
    assert res["result"]["entities"] == ["light.c"]
    assert entry.options["snapshot_entities"] == ["light.c"]


async def test_snapshot_without_entities_fails_clearly(
    hass, hass_ws_client, remote_device
) -> None:
    """No default and nothing picked → error, no scene written."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/create_snapshot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert not res["success"]
    assert "No capturable entities" in res["error"]["message"]
    assert _scenes_yaml(hass) == []

"""Link mode: slots point at native automations that stay enabled and canonical."""

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

from .conftest import fire_remote_action

SEQ_ORIG = [{"action": "test.automation", "data": {"via": "original"}}]


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


def _yaml(hass) -> list[dict]:
    return load_yaml(hass.config.path("automations.yaml")) or []


async def _setup(hass, device_id: str) -> MockConfigEntry:
    import yaml

    original = {
        "id": "orig_1",
        "alias": "Pilot 1_single",
        "triggers": [
            {
                "trigger": "device",
                "domain": "mqtt",
                "device_id": device_id,
                "type": "action",
                "subtype": "1_single",
            }
        ],
        "actions": SEQ_ORIG,
    }
    Path(hass.config.path("automations.yaml")).write_text(yaml.safe_dump([original]))
    assert await async_setup_component(hass, "automation", {})
    await hass.services.async_call("automation", "reload", blocking=True)
    await hass.async_block_till_done()

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


async def _ws(client, msg: dict) -> dict:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


async def test_import_links_by_default(hass, hass_ws_client, remote_device) -> None:
    """Default import keeps the automation native + enabled; slot just points."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    scan = (
        await _ws(client, {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id})
    )["result"]
    assert scan["proposals"][0]["linkable"] is True
    assert scan["proposals"][0]["mode"] == "link"
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": scan["proposals"],
        },
    )
    assert res["success"], res
    assert res["result"] == {
        "applied": [],
        "linked": ["1_single"],
        "conflicts": [],
        "disabled": [],
    }
    assert hass.states.get("automation.pilot_1_single").state == "on"

    slot = hass.data[DOMAIN]["store"].get_slot(entry.entry_id, "1_single")
    assert slot["materialized"] is True
    assert slot["owned"] is False
    assert slot["automation_id"] == "orig_1"
    assert slot["sequence"] == []

    # physical press: the automation runs itself, the dispatcher skips
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["original"]

    # get_remote carries the entity id; get_slot the live view with state
    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert res["result"]["slots"]["1_single"]["automation_entity_id"] == (
        "automation.pilot_1_single"
    )
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/get_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["result"]["live"]["owned"] is False
    assert res["result"]["live"]["state"] == "on"
    assert res["result"]["live"]["alias"] == "Pilot 1_single"


async def test_clear_and_release_leave_linked_automation_alone(
    hass, hass_ws_client, remote_device
) -> None:
    """Clearing a linked slot or handing back never touches the automation."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    scan = (
        await _ws(client, {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id})
    )["result"]
    await _ws(
        client,
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": scan["proposals"],
        },
    )
    # clear: no artifacts → no decision dialog, automation intact
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["success"] and not res["result"].get("needs_decision")
    assert [a["id"] for a in _yaml(hass)] == ["orig_1"]
    assert hass.states.get("automation.pilot_1_single").state == "on"

    # link again, then hand back: kept, alias untouched
    await _ws(
        client,
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": scan["proposals"],
        },
    )
    res = await _ws(
        client, {"type": f"{DOMAIN}/release_remote", "entry_id": entry.entry_id}
    )
    assert res["result"]["kept"] == ["1_single"]
    assert res["result"]["reenabled"] == []
    assert _yaml(hass)[0]["alias"] == "Pilot 1_single"
    assert hass.states.get("automation.pilot_1_single").state == "on"


async def test_link_existing_and_absorb(hass, hass_ws_client, remote_device) -> None:
    """save_slot link_entity_id links; unticking 'automation' absorbs + disables."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
            "link_entity_id": "automation.pilot_1_single",
            "name": "Linked",
        },
    )
    assert res["success"], res
    assert res["result"]["slot"]["automation_id"] == "orig_1"
    assert res["result"]["slot"]["owned"] is False
    assert res["result"]["slot"]["name"] == "Linked"

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "nope",
            "link_entity_id": "light.kitchen",
        },
    )
    assert not res["success"]

    # untick → absorb
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
            "materialized": False,
        },
    )
    assert res["success"], res
    slot = res["result"]["slot"]
    assert slot["materialized"] is False
    assert slot["sequence"] == SEQ_ORIG
    assert slot["imported_from"]["config_id"] == "orig_1"
    assert hass.states.get("automation.pilot_1_single").state == "off"
    assert [a["id"] for a in _yaml(hass)] == ["orig_1"]  # never deleted

    # now the slot runs it on 1_double; hand-back re-enables the original
    fire_remote_action(hass, "1_double")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["original"]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/release_remote",
            "entry_id": entry.entry_id,
            "convert_remaining": False,
        },
    )
    assert res["result"]["reenabled"] == ["automation.pilot_1_single"]
    assert hass.states.get("automation.pilot_1_single").state == "on"


async def test_absorb_mode_still_available(hass, hass_ws_client, remote_device) -> None:
    """mode=absorb keeps the old behavior: copied into the card, original off."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    scan = (
        await _ws(client, {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id})
    )["result"]
    proposals = [{**p, "mode": "absorb"} for p in scan["proposals"]]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": proposals,
        },
    )
    assert res["result"]["applied"] == ["1_single"]
    assert res["result"]["linked"] == []
    assert hass.states.get("automation.pilot_1_single").state == "off"


async def test_link_keeps_import_trail(hass, hass_ws_client, remote_device) -> None:
    """Linking a slot that was absorbed earlier keeps imported_from (chips stay)."""
    entry = await _setup(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    from custom_components.remote_mapper.store import default_slot

    slot = default_slot()
    slot["sequence"] = SEQ_ORIG
    slot["imported_from"] = {"entity_id": "automation.old", "config_id": "old"}
    store.async_set_slot(entry.entry_id, "1_double", slot)
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
            "link_entity_id": "automation.pilot_1_single",
        },
    )
    assert res["success"], res
    slot = store.get_slot(entry.entry_id, "1_double")
    assert slot["automation_id"] == "orig_1"
    assert slot["imported_from"]["config_id"] == "old"

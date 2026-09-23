# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""A linked per-remote automation (one choose branch per event) goes off whole.

Unticking "Keep linked" on one event moves every event it runs into the
card; Disable flags every linked event. Both refuse when the automation
also serves another remote.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN

from .conftest import fire_remote_action

SEQ_A = [{"action": "test.automation", "data": {"via": "a"}}]
SEQ_B = [{"action": "test.automation", "data": {"via": "b"}}]
ENTITY = "automation.pilot_kuchnia"


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


def _device_trigger(device_id: str, subtype: str, trigger_id: str) -> dict:
    return {
        "trigger": "device",
        "domain": "mqtt",
        "device_id": device_id,
        "type": "action",
        "subtype": subtype,
        "id": trigger_id,
    }


async def _setup(hass, device_id: str, extra_trigger: bool = False) -> MockConfigEntry:
    import yaml

    triggers = [
        _device_trigger(device_id, "1_single", "tap"),
        _device_trigger(device_id, "1_double", "double"),
    ]
    options = [
        {
            "alias": "Open",
            "conditions": [{"condition": "trigger", "id": "tap"}],
            "sequence": SEQ_A,
        },
        {"conditions": [{"condition": "trigger", "id": "double"}], "sequence": SEQ_B},
    ]
    if extra_trigger:  # another device's button in the same automation
        triggers.append(
            {"trigger": "state", "entity_id": "input_boolean.other", "id": "other"}
        )
        options.append(
            {"conditions": [{"condition": "trigger", "id": "other"}], "sequence": []}
        )
    automation = {
        "id": "per_remote",
        "alias": "Pilot kuchnia",
        "triggers": triggers,
        "actions": [{"choose": options}],
    }
    Path(hass.config.path("automations.yaml")).write_text(yaml.safe_dump([automation]))
    assert await async_setup_component(hass, "automation", {})
    await hass.services.async_call("automation", "reload", blocking=True)
    await hass.async_block_till_done()
    assert hass.states.get(ENTITY).state == "on"

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


async def _link_both(client, entry_id: str) -> None:
    for action_id in ("1_single", "1_double"):
        res = await _ws(
            client,
            {
                "type": f"{DOMAIN}/save_slot",
                "entry_id": entry_id,
                "action_id": action_id,
                "link_entity_id": ENTITY,
            },
        )
        assert res["success"], res


def _untick(entry_id: str) -> dict:
    return {
        "type": f"{DOMAIN}/save_slot",
        "entry_id": entry_id,
        "action_id": "1_single",
        "materialized": False,
        "name": None,
    }


async def test_untick_absorbs_every_branch(hass, hass_ws_client, remote_device) -> None:
    """Import links both events; unticking one moves both, each with its branch."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    store = hass.data[DOMAIN]["store"]

    scan = (
        await _ws(client, {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id})
    )["result"]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": scan["proposals"],
        },
    )
    assert sorted(res["result"]["linked"]) == ["1_double", "1_single"]

    # pads name each event by its branch, not by the shared alias
    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    single = res["result"]["slots"]["1_single"]
    assert (single["branch"], single["branch_alias"]) == (True, "Open")
    assert res["result"]["slots"]["1_double"]["branch_alias"] is None

    # the editor learns up front what unticking will move
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/get_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["result"]["live"]["whole"] == {
        "events": ["1_single", "1_double"],
        "linked": ["1_single", "1_double"],
        "foreign": False,
        "blocked": None,
    }

    res = await _ws(client, _untick(entry.entry_id))
    assert res["success"], res
    assert res["result"]["absorbed"] == ["1_single", "1_double"]
    assert hass.states.get(ENTITY).state == "off"
    single = store.get_slot(entry.entry_id, "1_single")
    double = store.get_slot(entry.entry_id, "1_double")
    assert single["sequence"] == SEQ_A
    assert double["sequence"] == SEQ_B
    assert not single["materialized"] and not double["materialized"]
    assert single["imported_from"]["config_id"] == "per_remote"
    assert double["imported_from"]["config_id"] == "per_remote"
    # a branch alias names its event; the automation's alias names none
    assert single["name"] == "Open"
    assert double["name"] is None

    fire_remote_action(hass, "1_double")
    await hass.async_block_till_done()
    assert [c.data["via"] for c in calls] == ["b"]

    # hand back turns the automation on again
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/release_remote",
            "entry_id": entry.entry_id,
            "convert_remaining": False,
        },
    )
    assert res["result"]["reenabled"] == [ENTITY]
    assert hass.states.get(ENTITY).state == "on"


async def test_untick_refused_when_another_event_has_its_own_action(
    hass, hass_ws_client, remote_device
) -> None:
    """1_double runs a card action: absorbing would drop one of the two."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    store = hass.data[DOMAIN]["store"]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "link_entity_id": ENTITY,
            "name": "Kept",
        },
    )
    assert res["success"], res
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
            "sequence": SEQ_A,
        },
    )
    assert res["success"], res

    res = await _ws(client, _untick(entry.entry_id))
    assert not res["success"]
    assert "1_double" in res["error"]["message"]
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["automation_id"] == "per_remote"
    assert slot["name"] == "Kept"  # refused save leaves the name alone
    assert hass.states.get(ENTITY).state == "on"


async def test_other_remote_trigger_blocks_untick_and_disable(
    hass, hass_ws_client, remote_device
) -> None:
    """Turning it off would silence the other trigger too: both refused."""
    entry = await _setup(hass, remote_device, extra_trigger=True)
    client = await hass_ws_client(hass)
    await _link_both(client, entry.entry_id)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/get_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    whole = res["result"]["live"]["whole"]
    assert whole["foreign"] is True
    assert "another remote or device" in whole["blocked"]

    res = await _ws(client, _untick(entry.entry_id))
    assert not res["success"]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/archive_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "archived": True,
        },
    )
    assert not res["success"]
    assert hass.states.get(ENTITY).state == "on"
    slot = hass.data[DOMAIN]["store"].get_slot(entry.entry_id, "1_single")
    assert slot["automation_id"] == "per_remote"
    assert slot["archived"] is False


async def test_disable_flags_every_linked_event(
    hass, hass_ws_client, remote_device
) -> None:
    """Disable/enable one linked event: the automation and every event follow."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    store = hass.data[DOMAIN]["store"]
    await _link_both(client, entry.entry_id)

    for archived, state in ((True, "off"), (False, "on")):
        res = await _ws(
            client,
            {
                "type": f"{DOMAIN}/archive_slot",
                "entry_id": entry.entry_id,
                "action_id": "1_double",
                "archived": archived,
            },
        )
        assert res["success"], res
        assert res["result"]["events"] == ["1_double", "1_single"]
        assert hass.states.get(ENTITY).state == state
        for action_id in ("1_single", "1_double"):
            assert store.get_slot(entry.entry_id, action_id)["archived"] is archived

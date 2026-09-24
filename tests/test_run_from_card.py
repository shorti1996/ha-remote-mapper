# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""A card tap runs whatever the slot is bound to, automations included.

The physical press keeps its skip matrix (the automation's own trigger
runs it); the tap has no such trigger, so run_slot runs the automation
itself: ``automation.trigger`` for a button's own or linked automation,
the branch's actions for a Shape A (per-remote) automation.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
import yaml
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.store import default_slot

from .conftest import fire_remote_action


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


async def _load_automations(hass, automations: list[dict]) -> None:
    Path(hass.config.path("automations.yaml")).write_text(yaml.safe_dump(automations))
    assert await async_setup_component(hass, "automation", {})
    await hass.services.async_call("automation", "reload", blocking=True)
    await hass.async_block_till_done()


async def _setup_remote(hass, device_id: str) -> MockConfigEntry:
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


async def _tap(hass, hass_ws_client, entry_id: str, action_id: str) -> dict:
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/run_slot", "entry_id": entry_id, "action_id": action_id}
    )
    res = await client.receive_json()
    assert res["success"], res
    await hass.async_block_till_done()
    return res["result"]


async def test_tap_triggers_linked_automation(hass, hass_ws_client, remote_device):
    """A linked automation with a trigger-reading condition still runs on tap."""
    calls = async_mock_service(hass, "test", "automation")
    await _load_automations(
        hass,
        [
            {
                "id": "native",
                "alias": "Native",
                "triggers": [_device_trigger(remote_device, "1_single", "tap")],
                # a physical press satisfies this; a tap has no trigger id
                "conditions": [{"condition": "trigger", "id": "tap"}],
                "actions": [{"action": "test.automation", "data": {"via": "native"}}],
            }
        ],
    )
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "link_entity_id": "automation.native",
        }
    )
    assert (await client.receive_json())["success"]

    result = await _tap(hass, hass_ws_client, entry.entry_id, "1_single")

    assert result["last_error"] is None
    assert [c.data["via"] for c in calls] == ["native"]
    slot = hass.data[DOMAIN]["store"].get_slot(entry.entry_id, "1_single")
    assert slot["last_run"] is not None

    # The physical press runs it once, through its own trigger only
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert len(calls) == 2


async def test_tap_runs_per_remote_branch(hass, hass_ws_client, remote_device):
    """A Shape A automation runs only this event's branch on tap."""
    calls = async_mock_service(hass, "test", "automation")
    await _load_automations(
        hass,
        [
            {
                "id": "per_remote",
                "alias": "Pilot",
                "triggers": [
                    _device_trigger(remote_device, "1_single", "tap"),
                    _device_trigger(remote_device, "1_double", "double"),
                ],
                "actions": [
                    {
                        "choose": [
                            {
                                "conditions": [{"condition": "trigger", "id": "tap"}],
                                "sequence": [
                                    {"action": "test.automation", "data": {"via": "a"}}
                                ],
                            },
                            {
                                "conditions": [
                                    {"condition": "trigger", "id": "double"}
                                ],
                                "sequence": [
                                    {"action": "test.automation", "data": {"via": "b"}}
                                ],
                            },
                        ]
                    }
                ],
            }
        ],
    )
    entry = await _setup_remote(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    for action_id in ("1_single", "1_double"):
        store.async_set_slot(
            entry.entry_id,
            action_id,
            {
                **default_slot(),
                "materialized": True,
                "shared_automation": True,
                "automation_id": "per_remote",
            },
        )

    result = await _tap(hass, hass_ws_client, entry.entry_id, "1_double")

    assert result["last_error"] is None
    assert [c.data["via"] for c in calls] == ["b"]


async def test_tap_reports_missing_automation(hass, hass_ws_client, remote_device):
    """A dangling pointer becomes last_error instead of a silent no-op."""
    calls = async_mock_service(hass, "test", "automation")
    await _load_automations(hass, [])
    entry = await _setup_remote(hass, remote_device)
    hass.data[DOMAIN]["store"].async_set_slot(
        entry.entry_id,
        "1_single",
        {**default_slot(), "materialized": True, "automation_id": "gone"},
    )

    result = await _tap(hass, hass_ws_client, entry.entry_id, "1_single")

    assert result["last_error"] == "The automation no longer exists"
    assert not calls

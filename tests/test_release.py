# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Hand-back flow: re-enable originals, convert/keep automations, remove entry."""

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
from custom_components.remote_mapper.materializer import automation_config_id

from .conftest import fire_remote_action

ORIGINAL = {
    "id": "orig_1",
    "alias": "Pilot 1_single",
    "triggers": [
        {
            "trigger": "device",
            "domain": "mqtt",
            "device_id": "DEVICE",
            "type": "action",
            "subtype": "1_single",
        }
    ],
    "actions": [{"action": "test.automation", "data": {"via": "original"}}],
}
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


def _yaml(hass) -> list[dict]:
    return load_yaml(hass.config.path("automations.yaml")) or []


async def _setup(hass, device_id: str) -> MockConfigEntry:
    """Remote + one pre-existing original automation on 1_single."""
    import yaml

    original = {
        **ORIGINAL,
        "triggers": [{**ORIGINAL["triggers"][0], "device_id": device_id}],
    }
    Path(hass.config.path("automations.yaml")).write_text(yaml.safe_dump([original]))
    assert await async_setup_component(hass, "automation", {})
    await hass.services.async_call("automation", "reload", blocking=True)
    await hass.async_block_till_done()
    assert hass.states.get("automation.pilot_1_single").state == "on"

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


async def _import_original(client, entry_id: str) -> None:
    scan = (await _ws(client, {"type": f"{DOMAIN}/scan_import", "entry_id": entry_id}))[
        "result"
    ]
    assert [p["action_id"] for p in scan["proposals"]] == ["1_single"]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry_id,
            "proposals": [{**p, "mode": "absorb"} for p in scan["proposals"]],
        },
    )
    assert res["success"], res


async def test_release_converts_and_reenables(
    hass, hass_ws_client, remote_device
) -> None:
    """Import + a card-built slot → release: original on, slot → plain automation."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _import_original(client, entry.entry_id)
    assert hass.states.get("automation.pilot_1_single").state == "off"

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
            "sequence": SEQ,
            "name": "Desk lamp",
        },
    )
    assert res["success"], res

    res = await _ws(
        client, {"type": f"{DOMAIN}/release_remote", "entry_id": entry.entry_id}
    )
    assert res["success"], res
    await hass.async_block_till_done()
    assert res["result"]["reenabled"] == ["automation.pilot_1_single"]
    assert res["result"]["converted"] == ["1_double"]
    assert res["result"]["dropped"] == []

    # original back on; converted slot is a plain automation (no prefix/marker)
    assert hass.states.get("automation.pilot_1_single").state == "on"
    converted = next(
        a
        for a in _yaml(hass)
        if a["id"] == automation_config_id(entry.entry_id, "1_double")
    )
    assert converted["alias"] == "Test Remote · Desk lamp"
    assert "Auto-managed" not in converted.get("description", "")
    assert converted["actions"] == SEQ

    # entry and store record are gone; the buttons still work natively
    assert hass.config_entries.async_get_entry(entry.entry_id) is None
    assert hass.data[DOMAIN]["store"].get_remote(entry.entry_id) is None
    fire_remote_action(hass, "1_single")
    fire_remote_action(hass, "1_double")
    await hass.async_block_till_done()
    assert sorted(c.data["via"] for c in calls) == ["original", "slot"]


async def test_release_without_convert_drops(
    hass, hass_ws_client, remote_device
) -> None:
    """convert_remaining=false: card-built slots are dropped, nothing created."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
            "sequence": SEQ,
        },
    )
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/release_remote",
            "entry_id": entry.entry_id,
            "convert_remaining": False,
        },
    )
    assert res["result"]["dropped"] == ["1_double"]
    assert res["result"]["converted"] == []
    assert [a["id"] for a in _yaml(hass)] == ["orig_1"]
    assert hass.config_entries.async_get_entry(entry.entry_id) is None


async def test_delete_integration_reenables_originals(
    hass, hass_ws_client, remote_device
) -> None:
    """Safety net: a plain entry removal never leaves imported originals off."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    await _import_original(client, entry.entry_id)
    assert hass.states.get("automation.pilot_1_single").state == "off"

    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("automation.pilot_1_single").state == "on"

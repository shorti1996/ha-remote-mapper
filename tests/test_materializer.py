# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Materialization tests: yaml round-trip, external edits, orphans."""

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
from custom_components.remote_mapper.store import default_slot

from .conftest import fire_remote_action

SEQ = [{"action": "test.automation", "data": {"via": "slot"}}]
FOREIGN = {
    "id": "foreign_auto",
    "alias": "Foreign",
    "triggers": [{"trigger": "state", "entity_id": "binary_sensor.x"}],
    "actions": [{"action": "test.automation", "data": {"via": "foreign"}}],
}


@pytest.fixture(autouse=True)
def automation_yaml_env(hass, remote_device):
    """Make automation.reload read the real automations.yaml.

    mqtt_mock's mock_hass_config patches load_yaml_config_file to {}, so
    reload would otherwise see no automations. This patch (entered after
    mqtt's — hence the remote_device dependency) serves the live file.
    Shared PHACC config dir → file cleaned per-test.
    """
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


def _automations_yaml(hass) -> list[dict]:
    path = Path(hass.config.path("automations.yaml"))
    if not path.exists():
        return []
    return load_yaml(str(path)) or []


async def _ws(client, msg: dict) -> dict:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


async def test_materialize_toggle_on(hass, hass_ws_client, remote_device) -> None:
    """Toggle on: automation created (plural keys), dispatcher hands over."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
        },
    )
    assert res["success"], res
    await hass.async_block_till_done()
    config_id = automation_config_id(entry.entry_id, "1_single")
    assert res["result"]["slot"]["materialized"] is True
    assert res["result"]["slot"]["automation_id"] == config_id

    items = _automations_yaml(hass)
    assert len(items) == 1
    assert items[0]["id"] == config_id
    assert items[0]["triggers"][0]["device_id"] == remote_device
    assert items[0]["actions"] == SEQ
    assert "trigger" not in items[0] and "action" not in items[0]

    # The automation entity exists and is on
    from custom_components.remote_mapper.materializer import automation_entity_id

    entity_id = automation_entity_id(hass, config_id)
    assert entity_id is not None
    assert hass.states.get(entity_id).state == "on"

    # Physical press runs the AUTOMATION exactly once (dispatcher skips)
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert len(calls) == 1

    # get_slot returns the live view with deep-link
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/get_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["result"]["live"]["actions"] == SEQ
    assert res["result"]["live"]["edit_url"] == f"/config/automation/edit/{config_id}"


async def test_dematerialize_folds_external_edit(
    hass, hass_ws_client, remote_device
) -> None:
    """Externally edited actions are canonical on toggle-off; automation gone."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)
    config_id = automation_config_id(entry.entry_id, "1_single")

    await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
        },
    )

    # External edit — what the native HA editor would do
    edited = [{"action": "test.automation", "data": {"via": "edited"}}]
    from custom_components.remote_mapper.materializer import _get_config_store

    raw = await _get_config_store(hass).async_get(config_id)
    raw.pop("id")
    raw["actions"] = edited
    await _get_config_store(hass).async_upsert(config_id, raw)
    await hass.async_block_till_done()

    # Toggle off without sending a sequence → live actions pulled
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
    slot = res["result"]["slot"]
    assert slot["materialized"] is False
    assert slot["automation_id"] is None
    assert slot["sequence"] == edited
    assert _automations_yaml(hass) == []


async def test_foreign_automations_preserved(
    hass, hass_ws_client, remote_device
) -> None:
    """Upsert and delete never touch foreign entries."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    from custom_components.remote_mapper.materializer import _get_config_store

    store = _get_config_store(hass)
    await hass.async_add_executor_job(store._write_sync, [FOREIGN])

    await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
        },
    )
    items = _automations_yaml(hass)
    assert len(items) == 2
    assert items[0] == FOREIGN

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    # Materialized automation is an owned artifact — policy dialog first
    assert res["result"]["needs_decision"] is True
    await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "decision": "delete",
        },
    )
    assert _automations_yaml(hass) == [FOREIGN]


async def test_clear_materialized_deletes_automation(
    hass, hass_ws_client, remote_device
) -> None:
    """Clearing a materialized slot removes its automation (owned)."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
        },
    )
    assert len(_automations_yaml(hass)) == 1

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["result"]["needs_decision"] is True
    assert "automation" in res["result"]["artifacts"]
    await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "decision": "delete",
        },
    )
    assert _automations_yaml(hass) == []
    store = hass.data[DOMAIN]["store"]
    assert store.get_slot(entry.entry_id, "1_single") is None


async def test_non_list_yaml_refused(hass, hass_ws_client, remote_device) -> None:
    """Unexpected automations.yaml content must never be coerced to [].

    Regression guard: coercing would make the next write destroy the
    user's automations.
    """
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    path = Path(hass.config.path("automations.yaml"))
    path.write_text("not_a_list:\n  nested: true\n")

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
        },
    )
    assert not res["success"]
    assert "refusing" in res["error"]["message"]
    # file untouched
    assert path.read_text() == "not_a_list:\n  nested: true\n"


async def test_write_leaves_backup(hass, hass_ws_client, remote_device) -> None:
    """Pre-write sidecar backup preserves the previous file content."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    from custom_components.remote_mapper.materializer import _get_config_store

    store = _get_config_store(hass)
    await hass.async_add_executor_job(store._write_sync, [FOREIGN])

    await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
        },
    )
    backup = Path(hass.config.path("automations.yaml.remote_mapper_backup"))
    assert backup.exists()
    assert load_yaml(str(backup)) == [FOREIGN]
    backup.unlink()


async def test_orphan_reset_on_reload(hass, hass_ws_client, remote_device) -> None:
    """Deleted-behind-our-back automation → slot reset at entry reload."""
    entry = await _setup(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    slot = {**default_slot(), "materialized": True, "automation_id": "gone_123"}
    store.async_set_slot(entry.entry_id, "1_single", slot)

    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()

    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["materialized"] is False
    assert slot["automation_id"] is None


async def test_plain_save_on_materialized_slot_rejected(
    hass, hass_ws_client, remote_device
) -> None:
    """While materialized the automation is canonical — sequence edits
    without the toggle keep it in sync via re-materialize."""
    entry = await _setup(hass, remote_device)
    client = await hass_ws_client(hass)

    await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": SEQ,
            "materialized": True,
        },
    )

    new_seq = [{"action": "test.automation", "data": {"via": "resave"}}]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": new_seq,
            "materialized": True,
        },
    )
    assert res["success"]
    items = _automations_yaml(hass)
    assert items[0]["actions"] == new_seq


def test_build_payload_alias_includes_name() -> None:
    """The slot name lands in the automation alias; absent name = old alias."""
    from custom_components.remote_mapper.materializer import build_payload

    trigger = {"platform": "device", "domain": "mqtt"}
    assert build_payload("Desk", "1_single", trigger, [])["alias"] == (
        "[remote_mapper] Desk · 1_single"
    )
    assert build_payload("Desk", "1_single", trigger, [], "Lamp")["alias"] == (
        "[remote_mapper] Desk · 1_single — Lamp"
    )

"""Import assistant tests — shapes A/B, flags, disable-not-delete."""

from __future__ import annotations

from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN

from .conftest import fire_remote_action


def _device_trigger(device_id: str, subtype: str, trigger_id: str | None = None):
    trigger = {
        "trigger": "device",
        "domain": "mqtt",
        "device_id": device_id,
        "type": "action",
        "subtype": subtype,
    }
    if trigger_id is not None:
        trigger["id"] = trigger_id
    return trigger


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


async def _setup_automations(hass, configs: list[dict]) -> None:
    assert await async_setup_component(hass, "automation", {"automation": configs})
    await hass.async_block_till_done()


SEQ_B1 = [{"action": "test.automation", "data": {"which": "b1"}}]
SEQ_B2 = [
    {
        "if": [{"condition": "template", "value_template": "{{ true }}"}],
        "then": [{"action": "test.automation", "data": {"which": "b2"}}],
    }
]


async def test_scan_shapes_a_and_b(hass, hass_ws_client, remote_device) -> None:
    """Shape A (choose keyed on trigger id) and B (flat) classify losslessly."""
    entry = await _setup_remote(hass, remote_device)
    await _setup_automations(
        hass,
        [
            {
                "id": "auto_a",
                "alias": "6gang desktop",
                "triggers": [
                    _device_trigger(remote_device, "1_single", "b1"),
                    _device_trigger(remote_device, "1_double", "b2"),
                ],
                "actions": [
                    {
                        "choose": [
                            {
                                "conditions": [{"condition": "trigger", "id": "b1"}],
                                "sequence": SEQ_B1,
                            },
                            {
                                "conditions": [{"condition": "trigger", "id": ["b2"]}],
                                "sequence": SEQ_B2,
                            },
                        ]
                    }
                ],
            },
            {
                # Shape B with legacy singular keys (hand-written style)
                "id": "auto_b",
                "alias": "Pilot single button",
                "trigger": _device_trigger(remote_device, "1_hold"),
                "action": [{"action": "test.automation", "data": {"which": "hold"}}],
            },
        ],
    )

    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id}
    )
    res = await client.receive_json()
    assert res["success"]

    by_action = {p["action_id"]: p for p in res["result"]["proposals"]}
    assert set(by_action) == {"1_single", "1_double", "1_hold"}
    assert by_action["1_single"]["sequence"] == SEQ_B1
    assert by_action["1_double"]["sequence"] == SEQ_B2  # if/then survives verbatim
    assert by_action["1_single"]["alias"] == "6gang desktop"
    assert by_action["1_single"]["source_config_id"] == "auto_a"
    assert by_action["1_single"]["disable_source"] is True
    assert by_action["1_hold"]["source_entity_id"] == "automation.pilot_single_button"
    assert res["result"]["skipped"] == []


async def test_scan_flags_unclassifiable(hass, hass_ws_client, remote_device) -> None:
    """choose with default: and non-trigger-keyed branches get flagged."""
    entry = await _setup_remote(hass, remote_device)
    await _setup_automations(
        hass,
        [
            {
                "id": "auto_default",
                "alias": "With default",
                "triggers": [_device_trigger(remote_device, "1_single", "b1")],
                "actions": [
                    {
                        "choose": [
                            {
                                "conditions": [{"condition": "trigger", "id": "b1"}],
                                "sequence": SEQ_B1,
                            }
                        ],
                        "default": [{"action": "test.automation"}],
                    }
                ],
            },
            {
                "id": "auto_statecond",
                "alias": "State keyed",
                "triggers": [
                    _device_trigger(remote_device, "1_single", "b1"),
                ],
                "actions": [
                    {
                        "choose": [
                            {
                                "conditions": [
                                    {
                                        "condition": "state",
                                        "entity_id": "light.x",
                                        "state": "on",
                                    }
                                ],
                                "sequence": SEQ_B1,
                            }
                        ]
                    }
                ],
            },
        ],
    )

    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id}
    )
    res = await client.receive_json()
    assert res["result"]["proposals"] == []
    reasons = {s["alias"]: s["reason"] for s in res["result"]["skipped"]}
    assert reasons["With default"] == "choose_has_default"
    assert reasons["State keyed"] == "branch_not_trigger_keyed"


async def test_scan_mixed_remote(hass, hass_ws_client, remote_device) -> None:
    """Mixed-device automation: matching branches only, source not disabled."""
    entry = await _setup_remote(hass, remote_device)
    await _setup_automations(
        hass,
        [
            {
                "id": "auto_mixed",
                "alias": "Two remotes",
                "triggers": [
                    _device_trigger(remote_device, "1_single", "b1"),
                    {
                        "trigger": "state",
                        "entity_id": "binary_sensor.other",
                        "id": "other",
                    },
                ],
                "actions": [
                    {
                        "choose": [
                            {
                                "conditions": [{"condition": "trigger", "id": "b1"}],
                                "sequence": SEQ_B1,
                            },
                            {
                                "conditions": [{"condition": "trigger", "id": "other"}],
                                "sequence": [{"action": "test.automation"}],
                            },
                        ]
                    }
                ],
            }
        ],
    )

    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id}
    )
    res = await client.receive_json()
    proposals = res["result"]["proposals"]
    assert len(proposals) == 1
    assert proposals[0]["action_id"] == "1_single"
    assert proposals[0]["mixed"] is True
    assert proposals[0]["disable_source"] is False


async def test_apply_import(hass, hass_ws_client, remote_device) -> None:
    """Apply writes slots, disables sources; slots fire identically."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup_remote(hass, remote_device)
    await _setup_automations(
        hass,
        [
            {
                "id": "auto_b",
                "alias": "Pilot",
                "trigger": _device_trigger(remote_device, "1_single"),
                "action": SEQ_B1,
            }
        ],
    )

    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/scan_import", "entry_id": entry.entry_id}
    )
    scan = (await client.receive_json())["result"]

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": scan["proposals"],
        }
    )
    res = await client.receive_json()
    assert res["success"]
    assert res["result"]["applied"] == ["1_single"]
    assert res["result"]["disabled"] == ["automation.pilot"]

    # Original disabled — not deleted
    state = hass.states.get("automation.pilot")
    assert state is not None
    assert state.state == "off"

    store = hass.data[DOMAIN]["store"]
    slot = store.get_slot(entry.entry_id, "1_single")
    assert slot["imported_from"] == {
        "entity_id": "automation.pilot",
        "config_id": "auto_b",
    }

    # The physical event now fires exactly once (slot, not the automation)
    calls.clear()
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert len(calls) == 1
    assert calls[0].data["which"] == "b1"


async def test_apply_conflict_skipped_without_overwrite(
    hass, hass_ws_client, remote_device
) -> None:
    """Assigned slot survives unless overwrite is requested."""
    from custom_components.remote_mapper.store import default_slot

    entry = await _setup_remote(hass, remote_device)
    store = hass.data[DOMAIN]["store"]
    original = {**default_slot(), "sequence": [{"action": "test.automation"}]}
    store.async_set_slot(entry.entry_id, "1_single", original)

    proposal = {
        "action_id": "1_single",
        "sequence": SEQ_B1,
        "source_entity_id": "automation.x",
        "source_config_id": "x",
        "alias": "X",
        "disable_source": False,
        "mixed": False,
        "conflict": True,
    }

    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": [proposal],
        }
    )
    res = await client.receive_json()
    assert res["result"]["applied"] == []
    assert res["result"]["conflicts"] == ["1_single"]
    assert store.get_slot(entry.entry_id, "1_single")["sequence"] == [
        {"action": "test.automation"}
    ]

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": entry.entry_id,
            "proposals": [proposal],
            "overwrite": True,
        }
    )
    res = await client.receive_json()
    assert res["result"]["applied"] == ["1_single"]
    assert store.get_slot(entry.entry_id, "1_single")["sequence"] == SEQ_B1

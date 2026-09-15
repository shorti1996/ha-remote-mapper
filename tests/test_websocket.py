"""Tests for the remote_mapper/* WebSocket commands."""

from __future__ import annotations

from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN, EVENT_UPDATED
from custom_components.remote_mapper.store import default_slot

from .conftest import fire_remote_action


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


async def _ws(client, msg: dict) -> dict:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


async def test_list_and_get_remote(hass, hass_ws_client, remote_device) -> None:
    """list_remotes and get_remote return the configured remote."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    res = await _ws(client, {"type": f"{DOMAIN}/list_remotes"})
    assert res["success"]
    assert res["result"]["remotes"] == [
        {"entry_id": entry.entry_id, "title": "Test Remote"}
    ]

    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert res["success"]
    assert res["result"]["title"] == "Test Remote"
    assert res["result"]["layout"] == {"actions": ["1_single", "1_double"]}
    assert res["result"]["slots"] == {}

    res = await _ws(client, {"type": f"{DOMAIN}/get_remote", "entry_id": "nope"})
    assert not res["success"]
    assert res["error"]["code"] == "not_found"


async def test_save_get_clear_slot(hass, hass_ws_client, remote_device) -> None:
    """Save (list form), read back, clear; events fire on mutations."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)
    events = async_capture_events(hass, EVENT_UPDATED)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": [{"action": "test.automation"}],
        },
    )
    assert res["success"]
    assert res["result"]["slot"]["sequence"] == [{"action": "test.automation"}]

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/get_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["result"]["slot"]["sequence"] == [{"action": "test.automation"}]

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/clear_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["success"]

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/get_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["result"]["slot"] is None

    kinds = [event.data["kind"] for event in events]
    assert kinds == ["slot_saved", "slot_cleared"]


async def test_save_slot_yaml_and_validation(
    hass, hass_ws_client, remote_device
) -> None:
    """YAML input is parsed; invalid sequences are rejected server-side."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence_yaml": "- action: test.automation\n  data:\n    x: 1\n",
        },
    )
    assert res["success"]
    assert res["result"]["slot"]["sequence"] == [
        {"action": "test.automation", "data": {"x": 1}}
    ]

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": [{"not_a_real_key": True}],
        },
    )
    assert not res["success"]
    assert res["error"]["code"] == "invalid_sequence"

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert not res["success"]
    assert res["error"]["code"] == "invalid_sequence"


async def test_save_slot_keeps_templates_raw(
    hass, hass_ws_client, remote_device
) -> None:
    """Templates persist as strings (validated output must never be stored)."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    async_mock_service(hass, "test", "automation")
    sequence = [
        {
            "if": [
                {
                    "condition": "template",
                    "value_template": "{{ states('light.x') == 'on' }}",
                }
            ],
            "then": [{"action": "test.automation"}],
        }
    ]
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": sequence,
        },
    )
    assert res["success"], res
    assert res["result"]["slot"]["sequence"] == sequence

    # get_remote must JSON-serialize (this is where Template objects blew up)
    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert res["success"], res
    assert res["result"]["slots"]["1_single"]["sequence"] == sequence

    await hass.data[DOMAIN]["store"].async_flush()

    # The slot still executes through runtime validation
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    slot = hass.data[DOMAIN]["store"].get_slot(entry.entry_id, "1_single")
    assert slot["last_error"] is None


async def test_archive_slot(hass, hass_ws_client, remote_device) -> None:
    """Archive flag flips; archiving an empty slot errors."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    store = hass.data[DOMAIN]["store"]
    store.async_set_slot(entry.entry_id, "1_single", default_slot())

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/archive_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "archived": True,
        },
    )
    assert res["success"]
    assert store.get_slot(entry.entry_id, "1_single")["archived"] is True

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/archive_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_double",
            "archived": True,
        },
    )
    assert not res["success"]
    assert res["error"]["code"] == "not_found"


async def test_save_layout(hass, hass_ws_client, remote_device) -> None:
    """Card layout persists server-side on the remote record."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    layout = {"widgets": [{"id": "1_single", "x": 0, "y": 0, "w": 2, "h": 2}]}
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_layout",
            "entry_id": entry.entry_id,
            "card_layout": layout,
        },
    )
    assert res["success"]

    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert res["result"]["card_layout"] == layout


async def test_probe_device(hass, hass_ws_client, remote_device) -> None:
    """probe_device re-enumerates via the adapter."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    res = await _ws(
        client, {"type": f"{DOMAIN}/probe_device", "entry_id": entry.entry_id}
    )
    assert res["success"]
    assert res["result"]["actions"] == ["1_single", "1_double"]


async def test_run_slot(hass, hass_ws_client, remote_device) -> None:
    """run_slot fires the bound sequence from the card."""
    calls = async_mock_service(hass, "test", "automation")
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    store = hass.data[DOMAIN]["store"]
    store.async_set_slot(
        entry.entry_id,
        "1_single",
        {**default_slot(), "sequence": [{"action": "test.automation"}]},
    )

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/run_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
        },
    )
    assert res["success"]
    assert res["result"]["last_error"] is None
    assert len(calls) == 1

    # Physical event still works alongside (sanity)
    fire_remote_action(hass, "1_single")
    await hass.async_block_till_done()
    assert len(calls) == 2


async def test_get_remote_buttons(hass, hass_ws_client, remote_device) -> None:
    """get_remote groups actions into buttons and exposes the grid layout."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert res["success"]
    assert res["result"]["buttons"] == [
        {
            "id": "1",
            "label": "1",
            "actions": [
                {"action_id": "1_single", "event": "single", "kind": "single"},
                {"action_id": "1_double", "event": "double", "kind": "double"},
            ],
        }
    ]
    assert res["result"]["grid_layout"] is None


async def test_save_grid_layout(hass, hass_ws_client, remote_device) -> None:
    """Grid layout round-trips, is validated, and leaves the canvas alone."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)
    events = async_capture_events(hass, EVENT_UPDATED)

    grid = {
        "schema_version": 1,
        "rows": 2,
        "cols": 1,
        "buttons": {"1": {"row": 1, "col": 0, "label": "Top"}},
    }
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_layout",
            "entry_id": entry.entry_id,
            "grid_layout": grid,
        },
    )
    assert res["success"]
    assert events[-1].data["kind"] == "layout_saved"

    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert res["result"]["grid_layout"] == grid
    assert res["result"]["card_layout"] is None

    # Out of range / shared cell / missing both → rejected, stored value kept
    for bad in (
        {**grid, "buttons": {"1": {"row": 2, "col": 0}}},
        {
            **grid,
            "buttons": {"1": {"row": 0, "col": 0}, "2": {"row": 0, "col": 0}},
        },
        {**grid, "rows": 0},
    ):
        res = await _ws(
            client,
            {
                "type": f"{DOMAIN}/save_layout",
                "entry_id": entry.entry_id,
                "grid_layout": bad,
            },
        )
        assert not res["success"], bad
        assert res["error"]["code"] == "invalid_format"

    res = await _ws(
        client, {"type": f"{DOMAIN}/save_layout", "entry_id": entry.entry_id}
    )
    assert not res["success"]
    assert res["error"]["code"] == "invalid_format"

    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert res["result"]["grid_layout"] == grid


async def test_refresh_actions(hass, hass_ws_client, remote_device) -> None:
    """A later-discovered action is added to the layout AND dispatched live."""
    import json

    from pytest_homeassistant_custom_component.common import async_fire_mqtt_message

    from .conftest import REMOTE_IDENTIFIER, REMOTE_TOPIC

    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    # Nothing new yet
    res = await _ws(
        client, {"type": f"{DOMAIN}/refresh_actions", "entry_id": entry.entry_id}
    )
    assert res["success"]
    assert res["result"] == {"added": [], "stale": [], "probed": True}

    # Z2M lazily publishes discovery for 1_hold after the user presses it
    async_fire_mqtt_message(
        hass,
        "homeassistant/device_automation/test_remote/action_1_hold/config",
        json.dumps(
            {
                "automation_type": "trigger",
                "topic": REMOTE_TOPIC,
                "payload": "1_hold",
                "type": "action",
                "subtype": "1_hold",
                "device": {"identifiers": [REMOTE_IDENTIFIER[1]]},
            }
        ),
    )
    await hass.async_block_till_done()

    res = await _ws(
        client, {"type": f"{DOMAIN}/refresh_actions", "entry_id": entry.entry_id}
    )
    assert res["result"]["added"] == ["1_hold"]

    res = await _ws(
        client, {"type": f"{DOMAIN}/get_remote", "entry_id": entry.entry_id}
    )
    assert "1_hold" in res["result"]["layout"]["actions"]
    assert [b["id"] for b in res["result"]["buttons"]] == ["1"]
    assert [a["event"] for a in res["result"]["buttons"][0]["actions"]] == [
        "single",
        "double",
        "hold",
    ]

    # The live subscription now covers the new action — no restart needed
    calls = async_mock_service(hass, "test", "automation")
    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_hold",
            "sequence": [{"action": "test.automation"}],
        },
    )
    assert res["success"]
    fire_remote_action(hass, "1_hold")
    await hass.async_block_till_done()
    assert len(calls) == 1


async def test_slot_name_round_trip(hass, hass_ws_client, remote_device) -> None:
    """A user name persists with the slot; empty clears it back to auto."""
    entry = await _setup_remote(hass, remote_device)
    client = await hass_ws_client(hass)

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": [{"action": "test.automation"}],
            "name": "  Desk light  ",
        },
    )
    assert res["success"]
    assert res["result"]["slot"]["name"] == "Desk light"

    res = await _ws(
        client,
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": entry.entry_id,
            "action_id": "1_single",
            "sequence": [{"action": "test.automation"}],
            "name": "",
        },
    )
    assert res["result"]["slot"]["name"] is None

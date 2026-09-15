"""WebSocket API for the Remote Mapper card.

Flat command naming (remote_mapper/<verb>_<noun>). Every mutating handler
fires EVENT_UPDATED so all card instances refetch.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.script import async_validate_actions_config
from homeassistant.util.yaml import parse_yaml

from .buttons import group_buttons
from .const import DOMAIN, EVENT_UPDATED, INTEGRATION_VERSION
from .store import default_slot

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .dispatcher import SlotDispatcher
    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)

ERR_NOT_FOUND = "not_found"
ERR_INVALID_SEQUENCE = "invalid_sequence"
ERR_INVALID_FORMAT = "invalid_format"

GRID_MAX: int = 12


def _grid_cells_unique_and_in_range(layout: dict[str, Any]) -> dict[str, Any]:
    """Every placed button inside rows x cols, one button per cell."""
    taken: dict[tuple[int, int], str] = {}
    for button_id, pos in layout["buttons"].items():
        cell = (pos["row"], pos["col"])
        if pos["row"] >= layout["rows"] or pos["col"] >= layout["cols"]:
            raise vol.Invalid(
                f"button {button_id} outside the {layout['rows']}x{layout['cols']} grid"
            )
        if (other := taken.get(cell)) is not None:
            raise vol.Invalid(f"buttons {other} and {button_id} share a cell")
        taken[cell] = button_id
    return layout


# Per-remote grid layout (plan 04 §1.2): positions + optional label
# override only; the button ↔ action grouping stays derived.
GRID_LAYOUT_SCHEMA = vol.All(
    vol.Schema(
        {
            vol.Required("schema_version"): int,
            vol.Required("rows"): vol.All(int, vol.Range(min=1, max=GRID_MAX)),
            vol.Required("cols"): vol.All(int, vol.Range(min=1, max=GRID_MAX)),
            vol.Required("buttons"): {
                str: vol.Schema(
                    {
                        vol.Required("row"): vol.All(int, vol.Range(min=0)),
                        vol.Required("col"): vol.All(int, vol.Range(min=0)),
                        vol.Optional("label"): str,
                    }
                )
            },
        }
    ),
    _grid_cells_unique_and_in_range,
)


def _store(hass: HomeAssistant) -> RemoteMapperStore:
    return hass.data[DOMAIN]["store"]


def _dispatcher(hass: HomeAssistant, entry_id: str) -> SlotDispatcher | None:
    runtime = hass.data[DOMAIN].get(entry_id)
    return runtime.get("dispatcher") if runtime else None


def _fire_updated(hass: HomeAssistant, entry_id: str, kind: str) -> None:
    hass.bus.async_fire(EVENT_UPDATED, {"entry_id": entry_id, "kind": kind})


async def _validated_sequence(hass: HomeAssistant, msg: dict) -> list[dict[str, Any]]:
    """Parse (optionally from YAML) and validate a sequence.

    Validation is a GATE — the returned sequence is the RAW input, never
    the validated output. Validators rewrite values into runtime objects
    (template strings → Template, durations → timedelta) that neither
    JSON-serialize (WS responses, Store persistence) nor yaml-dump
    (materializer). The dispatcher re-validates at run time.

    Raises vol.Invalid / HomeAssistantError on bad input — callers map
    that to ERR_INVALID_SEQUENCE.
    """
    if (yaml_text := msg.get("sequence_yaml")) is not None:
        sequence = parse_yaml(yaml_text)
    else:
        sequence = msg["sequence"]
    if sequence in (None, ""):
        sequence = []
    if isinstance(sequence, dict):
        sequence = [sequence]
    if not isinstance(sequence, list):
        raise vol.Invalid("Sequence must be a list of actions")
    validated = cv.SCRIPT_SCHEMA(sequence)
    await async_validate_actions_config(hass, validated)
    return sequence


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/ping"})
@websocket_api.async_response
async def ws_ping(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Handshake: card verifies the backend is present."""
    connection.send_result(msg["id"], {"version": INTEGRATION_VERSION})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list_remotes"})
@websocket_api.async_response
async def ws_list_remotes(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """All configured remotes — used by the card when entry_id is omitted."""
    remotes = [
        {"entry_id": entry.entry_id, "title": entry.title}
        for entry in hass.config_entries.async_entries(DOMAIN)
    ]
    connection.send_result(msg["id"], {"remotes": remotes})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get_remote",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_get_remote(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Full remote view: layout, derived buttons, both card layouts, slots."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    remote = _store(hass).get_remote(msg["entry_id"])
    if entry is None or remote is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return
    layout = remote.get("layout", {})
    connection.send_result(
        msg["id"],
        {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "layout": layout,
            "buttons": group_buttons(remote.get("source"), layout.get("actions", [])),
            "card_layout": remote.get("card_layout"),
            "grid_layout": remote.get("grid_layout"),
            "slots": remote.get("slots", {}),
            "stale_actions": remote.get("stale_actions", []),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get_slot",
        vol.Required("entry_id"): str,
        vol.Required("action_id"): str,
    }
)
@websocket_api.async_response
async def ws_get_slot(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Single slot record; null = Empty.

    Materialized slots get a live automation summary — the automation is
    canonical, the store holds only the pointer.
    """
    from .materializer import async_get_live_view

    if _store(hass).get_remote(msg["entry_id"]) is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return
    slot = _store(hass).get_slot(msg["entry_id"], msg["action_id"])
    live = None
    if slot and slot.get("materialized"):
        live = await async_get_live_view(hass, slot)
    connection.send_result(msg["id"], {"slot": slot, "live": live})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save_slot",
        vol.Required("entry_id"): str,
        vol.Required("action_id"): str,
        vol.Optional("sequence"): vol.Any(list, None),
        vol.Optional("sequence_yaml"): str,
        vol.Optional("materialized"): bool,
    }
)
@websocket_api.async_response
async def ws_save_slot(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Write a slot (validated server-side); handles the materialize toggle.

    Draft-then-commit: nothing touches HA's automation store until this
    save. Toggle on → automation created from the sequence; toggle off →
    provided (or live-fetched) actions land back in the store and the
    automation is deleted.
    """
    from .materializer import (
        async_dematerialize,
        async_materialize,
    )

    store = _store(hass)
    if store.get_remote(msg["entry_id"]) is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return

    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    slot = store.get_slot(msg["entry_id"], msg["action_id"])
    was_materialized = bool(slot and slot.get("materialized"))
    target_materialized = msg.get("materialized", was_materialized)

    sequence: list | None = None
    if "sequence" in msg or "sequence_yaml" in msg:
        try:
            sequence = await _validated_sequence(hass, msg)
        except Exception as err:
            connection.send_error(msg["id"], ERR_INVALID_SEQUENCE, str(err))
            return
    elif not was_materialized:
        connection.send_error(msg["id"], ERR_INVALID_SEQUENCE, "No sequence given")
        return

    if was_materialized and not target_materialized:
        # Dematerialize: sequence=None pulls the automation's current
        # actions (external edits are canonical)
        await async_dematerialize(
            hass, store, msg["entry_id"], msg["action_id"], sequence
        )
    else:
        if sequence is not None:
            slot = slot or default_slot()
            slot["sequence"] = sequence
            # Manual edit breaks the canonical snapshot-scene link (§4)
            slot["scene_id"] = None
            store.async_set_slot(msg["entry_id"], msg["action_id"], slot)
        if target_materialized:
            try:
                await async_materialize(
                    hass,
                    store,
                    msg["entry_id"],
                    msg["action_id"],
                    entry.title if entry else "Remote",
                )
            except Exception as err:
                connection.send_error(msg["id"], ERR_INVALID_SEQUENCE, str(err))
                return

    _fire_updated(hass, msg["entry_id"], "slot_saved")
    connection.send_result(
        msg["id"], {"slot": store.get_slot(msg["entry_id"], msg["action_id"])}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/clear_slot",
        vol.Required("entry_id"): str,
        vol.Required("action_id"): str,
        vol.Optional("decision"): vol.In(["delete", "keep"]),
        vol.Optional("remember", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_clear_slot(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Remove a slot record (back to Empty), applying the cleanup policy.

    Owned artifacts (snapshot scene, materialized automation) fall under
    one remembered choice. Policy "ask" without a decision returns
    needs_decision — the card shows the dialog and re-calls.
    """
    from . import cleanup

    store = _store(hass)
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    artifacts = cleanup.collect_artifacts(
        hass, store, msg["entry_id"], msg["action_id"]
    )

    if artifacts:
        policy = cleanup.get_policy(entry)
        decision = msg.get("decision")
        if decision is None:
            if policy == "ask":
                connection.send_result(
                    msg["id"], {"needs_decision": True, "artifacts": artifacts}
                )
                return
            decision = "delete" if policy == "always_delete" else "keep"
        elif msg["remember"] and entry is not None:
            cleanup.async_remember_policy(hass, entry, decision)
        await cleanup.async_cleanup_artifacts(hass, store, artifacts, decision)

    store.async_clear_slot(msg["entry_id"], msg["action_id"])
    _fire_updated(hass, msg["entry_id"], "slot_cleared")
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/create_snapshot",
        vol.Required("entry_id"): str,
        vol.Required("action_id"): str,
        vol.Optional("name"): str,
        vol.Optional("entities"): [str],
        vol.Optional("re_snapshot", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_create_snapshot(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Snapshot current state → persistent scene bound to the slot.

    Entity list defaults to the remote's snapshot_entities option
    (applied server-side); re_snapshot reuses the owned scene's set.
    """
    from .const import CONF_SNAPSHOT_ENTITIES
    from .snapshot import async_create_snapshot

    store = _store(hass)
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or store.get_remote(msg["entry_id"]) is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return

    entities = msg.get("entities") or list(
        entry.options.get(CONF_SNAPSHOT_ENTITIES, [])
    )
    name = msg.get("name") or f"{entry.title} {msg['action_id']}"

    try:
        result = await async_create_snapshot(
            hass,
            store,
            msg["entry_id"],
            msg["action_id"],
            entities,
            name,
            re_snapshot=msg["re_snapshot"],
        )
    except Exception as err:
        connection.send_error(msg["id"], ERR_INVALID_SEQUENCE, str(err))
        return
    _fire_updated(hass, msg["entry_id"], "snapshot_created")
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/archive_slot",
        vol.Required("entry_id"): str,
        vol.Required("action_id"): str,
        vol.Required("archived"): bool,
    }
)
@websocket_api.async_response
async def ws_archive_slot(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Archive (soft-disable) or unarchive a slot."""
    store = _store(hass)
    slot = store.get_slot(msg["entry_id"], msg["action_id"])
    if slot is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Slot is empty")
        return
    slot["archived"] = msg["archived"]
    store.async_set_slot(msg["entry_id"], msg["action_id"], slot)
    _fire_updated(hass, msg["entry_id"], "slot_archived")
    connection.send_result(msg["id"], {"slot": slot})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save_layout",
        vol.Required("entry_id"): str,
        vol.Optional("card_layout"): dict,
        vol.Optional("grid_layout"): GRID_LAYOUT_SCHEMA,
    }
)
@websocket_api.async_response
async def ws_save_layout(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Persist a card layout (belongs to the remote, not the card).

    ``card_layout`` is the free-drag canvas, ``grid_layout`` the button
    grid; either or both — the other is left untouched.
    """
    store = _store(hass)
    remote = store.get_remote(msg["entry_id"])
    if remote is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return
    if "card_layout" not in msg and "grid_layout" not in msg:
        connection.send_error(
            msg["id"], ERR_INVALID_FORMAT, "card_layout or grid_layout required"
        )
        return
    if "card_layout" in msg:
        remote["card_layout"] = msg["card_layout"]
    if "grid_layout" in msg:
        remote["grid_layout"] = msg["grid_layout"]
    store.async_schedule_save()
    _fire_updated(hass, msg["entry_id"], "layout_saved")
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/probe_device",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_probe_device(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Re-enumerate available actions via the remote's adapter."""
    from .adapters import get_adapter

    remote = _store(hass).get_remote(msg["entry_id"])
    if remote is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return
    adapter = get_adapter(remote["source"])
    actions = await adapter.async_default_actions(hass, remote["source_config"])
    connection.send_result(msg["id"], {"actions": actions})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/refresh_actions",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_refresh_actions(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Re-probe the source now: add newly discovered actions, flag stale ones.

    Same routine as the startup drift check — Z2M discovers actions lazily
    (press each button once), so this is the "I pressed them, pick them
    up" button.
    """
    from . import async_refresh_actions

    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    store = _store(hass)
    if entry is None or store.get_remote(msg["entry_id"]) is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return
    result = await async_refresh_actions(hass, store, entry)
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/scan_import",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_scan_import(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Scan existing automations on the remote's device for import."""
    from .importer import ImportScanner

    store = _store(hass)
    remote = store.get_remote(msg["entry_id"])
    if remote is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return
    device_id = remote.get("source_config", {}).get("device_id")
    if not device_id:
        connection.send_error(
            msg["id"], ERR_NOT_FOUND, "Import needs a device-based remote"
        )
        return
    scanner = ImportScanner(hass, msg["entry_id"], device_id)
    connection.send_result(msg["id"], scanner.scan(store))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/apply_import",
        vol.Required("entry_id"): str,
        vol.Required("proposals"): [dict],
        vol.Optional("overwrite", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_apply_import(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Apply selected import proposals; sources disabled, never deleted."""
    from .importer import async_apply

    store = _store(hass)
    if store.get_remote(msg["entry_id"]) is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Unknown remote")
        return

    validated_proposals = []
    for proposal in msg["proposals"]:
        try:
            sequence = await _validated_sequence(
                hass, {"sequence": proposal.get("sequence", [])}
            )
        except Exception as err:
            connection.send_error(
                msg["id"],
                ERR_INVALID_SEQUENCE,
                f"{proposal.get('action_id')}: {err}",
            )
            return
        validated_proposals.append({**proposal, "sequence": sequence})

    result = await async_apply(
        hass, store, msg["entry_id"], validated_proposals, msg["overwrite"]
    )
    _fire_updated(hass, msg["entry_id"], "import_applied")
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/run_slot",
        vol.Required("entry_id"): str,
        vol.Required("action_id"): str,
    }
)
@websocket_api.async_response
async def ws_run_slot(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Fire the bound sequence from the card (test from the couch).

    On-screen tap ≠ physical event — this runs the slot regardless of the
    dispatcher's subscription, but honors the same skip matrix.
    """
    dispatcher = _dispatcher(hass, msg["entry_id"])
    if dispatcher is None:
        connection.send_error(msg["id"], ERR_NOT_FOUND, "Remote not loaded")
        return
    await dispatcher.async_dispatch(msg["action_id"])
    slot = _store(hass).get_slot(msg["entry_id"], msg["action_id"])
    connection.send_result(
        msg["id"], {"last_error": slot.get("last_error") if slot else None}
    )


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all remote_mapper/* commands (called once from async_setup)."""
    for command in (
        ws_ping,
        ws_list_remotes,
        ws_get_remote,
        ws_get_slot,
        ws_save_slot,
        ws_clear_slot,
        ws_create_snapshot,
        ws_archive_slot,
        ws_save_layout,
        ws_probe_device,
        ws_refresh_actions,
        ws_scan_import,
        ws_apply_import,
        ws_run_slot,
    ):
        websocket_api.async_register_command(hass, command)

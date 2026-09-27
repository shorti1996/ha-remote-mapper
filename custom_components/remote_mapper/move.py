# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Move a slot to another event — same button or another one.

The slot record travels as is (sequence, name, scene, import trail,
disabled flag); what is bound to the event id follows it:

- an automation the card created is re-created for the new event (the
  config id and trigger are derived from the event, so it is a new
  automation in HA);
- a branch of the remote's shared automation is re-keyed to the new
  event's trigger;
- a linked native automation of the same shape is edited the same way:
  its branch is re-keyed, or a flat one gets the new event's trigger.
  Any other shape is refused with the reason;
- an owned snapshot scene keeps its id and entity set, only its owner
  record changes.

A set target swaps: both slots move in one step. The automations are
edited first, so a refusal leaves the card untouched.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.exceptions import HomeAssistantError

from .materializer import async_dematerialize, async_materialize, is_linked
from .remote_automation import async_move_branches, is_shared

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)

KIND_PLAIN = "plain"
KIND_OWNED = "owned"
KIND_SHARED = "shared"
KIND_LINKED = "linked"


def _kind(slot: dict[str, Any]) -> str:
    if is_linked(slot):
        return KIND_LINKED
    if is_shared(slot):
        return KIND_SHARED
    if slot.get("materialized"):
        return KIND_OWNED
    return KIND_PLAIN


async def async_move_slot(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    source: str,
    target: str,
    title: str,
) -> dict[str, Any]:
    """Move the slot at ``source`` to ``target``; a set target swaps.

    Returns ``{"moved": [source, ...], "swapped": bool}``.
    """
    remote = store.get_remote(entry_id)
    if remote is None:
        raise HomeAssistantError(f"Unknown remote {entry_id}")
    actions = list(remote.get("layout", {}).get("actions", []))
    if source == target:
        raise HomeAssistantError("Pick a different event to move to")
    if target not in actions:
        raise HomeAssistantError(f"{target} is not an event of this remote")
    source_slot = store.get_slot(entry_id, source)
    if source_slot is None:
        raise HomeAssistantError(f"{source} has nothing to move")
    target_slot = store.get_slot(entry_id, target)

    moves: dict[str, str] = {source: target}
    if target_slot is not None:
        moves[target] = source

    # 1. Re-key the automations that stay: one write per automation. A
    #    linked automation of another shape refuses here, before any
    #    change, so the card keeps matching HA.
    kinds: dict[str, str] = {}
    by_automation: dict[str | None, dict[str, str]] = {}
    for src, dst in moves.items():
        slot = store.get_slot(entry_id, src)
        kinds[src] = _kind(slot)
        if kinds[src] == KIND_SHARED:
            by_automation.setdefault(None, {})[src] = dst
        elif kinds[src] == KIND_LINKED:
            by_automation.setdefault(slot["automation_id"], {})[src] = dst
    for config_id, branch_moves in by_automation.items():
        await async_move_branches(
            hass, store, entry_id, branch_moves, config_id=config_id
        )

    # 2. Detach: automations the card created go, their actions come back
    #    into the record.
    records: dict[str, dict[str, Any]] = {}
    for src in moves:
        if kinds[src] == KIND_OWNED:
            await async_dematerialize(hass, store, entry_id, src, None)
        records[src] = dict(store.get_slot(entry_id, src))

    # 3. The records change places.
    for src in moves:
        store.async_clear_slot(entry_id, src)
    for src, dst in moves.items():
        record = records[src]
        record["last_run"] = None
        record["last_error"] = None
        store.async_set_slot(entry_id, dst, record)
        if scene_id := record.get("scene_id"):
            store.async_move_owned_scene(scene_id, f"{entry_id}/{dst}")

    # 4. Re-create the card's own automations under the new event ids.
    for src, dst in moves.items():
        if kinds[src] == KIND_OWNED:
            # async_materialize switches an archived record's automation off
            await async_materialize(hass, store, entry_id, dst, title)

    _LOGGER.info(
        "%s: moved %s", entry_id, ", ".join(f"{s}→{d}" for s, d in moves.items())
    )
    return {"moved": list(moves), "swapped": target_slot is not None}

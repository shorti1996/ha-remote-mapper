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

To another remote (plan ai/08) the same record travels, and what is
bound to the remote is rebuilt for the other one:

- the card's own automation is re-created with the other remote's trigger;
- a branch of the shared automation is detached into the record, then
  added as a branch of the other remote's shared automation when it has
  one, else the record runs from the card there;
- a linked flat automation gets the other remote's trigger; a linked
  per-remote automation is refused (see async_retarget_linked);
- an owned scene stays, its owner record is re-pointed;
- an import trail stays with the source remote, which disabled the
  original and turns it on again on hand-back.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.exceptions import HomeAssistantError

from .materializer import async_dematerialize, async_materialize, is_linked
from .remote_automation import (
    _normalized,
    async_add_branch,
    async_detach_branch,
    async_exists,
    async_move_branches,
    async_retarget_linked,
    find_branch,
    is_shared,
)

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
    target_entry_id: str | None = None,
    target_title: str | None = None,
) -> dict[str, Any]:
    """Move the slot at ``source`` to ``target``; a set target swaps.

    ``target`` is an event of ``target_entry_id`` when given, else of the
    same remote. Returns ``{"moved": [source, ...], "swapped": bool}``.
    """
    remote = store.get_remote(entry_id)
    if remote is None:
        raise HomeAssistantError(f"Unknown remote {entry_id}")
    if target_entry_id is not None and target_entry_id != entry_id:
        return await _async_move_across(
            hass,
            store,
            entry_id,
            source,
            target_entry_id,
            target,
            {entry_id: title, target_entry_id: target_title or title},
        )
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


Slot = tuple[str, str]  # (entry_id, action_id)


async def _async_move_across(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    source_entry_id: str,
    source: str,
    target_entry_id: str,
    target: str,
    titles: dict[str, str],
) -> dict[str, Any]:
    """Move a slot to an event of another remote; a set target swaps.

    Every refusal runs before the first write. Then, per moved slot: the
    automation it lives in is retargeted or let go, the record changes
    remote, and the automation is rebuilt on the other side.
    """
    from .release import imported_sources

    target_remote = store.get_remote(target_entry_id)
    if target_remote is None:
        raise HomeAssistantError(f"Unknown remote {target_entry_id}")
    if target not in target_remote.get("layout", {}).get("actions", []):
        raise HomeAssistantError(f"{target} is not an event of the other remote")
    if store.get_slot(source_entry_id, source) is None:
        raise HomeAssistantError(f"{source} has nothing to move")

    src: Slot = (source_entry_id, source)
    dst: Slot = (target_entry_id, target)
    moves: dict[Slot, Slot] = {src: dst}
    swapped = store.get_slot(target_entry_id, target) is not None
    if swapped:
        moves[dst] = src

    # 1. Refuse before anything changes.
    kinds: dict[Slot, str] = {}
    for (from_entry, from_event), (to_entry, to_event) in moves.items():
        slot = store.get_slot(from_entry, from_event)
        kinds[from_entry, from_event] = _kind(slot)
        if kinds[from_entry, from_event] == KIND_LINKED:
            await async_retarget_linked(
                hass,
                store,
                slot["automation_id"],
                from_entry,
                from_event,
                to_entry,
                to_event,
                check_only=True,
            )

    # 2. Automations bound to the source remote: retargeted or let go.
    records: dict[Slot, dict[str, Any]] = {}
    for (from_entry, from_event), (to_entry, to_event) in moves.items():
        slot = store.get_slot(from_entry, from_event)
        kind = kinds[from_entry, from_event]
        if kind == KIND_LINKED:
            await async_retarget_linked(
                hass,
                store,
                slot["automation_id"],
                from_entry,
                from_event,
                to_entry,
                to_event,
            )
        elif kind == KIND_SHARED:
            await async_detach_branch(hass, store, from_entry, from_event, None)
        elif kind == KIND_OWNED:
            await async_dematerialize(hass, store, from_entry, from_event, None)
        records[from_entry, from_event] = dict(store.get_slot(from_entry, from_event))

    # 3. The records change remote. The import trail stays behind: the
    #    source remote disabled the original and hands it back.
    for from_entry, from_event in moves:
        store.async_clear_slot(from_entry, from_event)
    for (from_entry, from_event), (to_entry, to_event) in moves.items():
        record = records[from_entry, from_event]
        if sources := imported_sources(record):
            store.async_remember_disabled(from_entry, sources)
        record.pop("imported_from", None)
        record["last_run"] = None
        record["last_error"] = None
        store.async_set_slot(to_entry, to_event, record)
        if scene_id := record.get("scene_id"):
            store.async_move_owned_scene(scene_id, f"{to_entry}/{to_event}")

    # 4. Rebuilt on the other side.
    for (from_entry, from_event), (to_entry, to_event) in moves.items():
        kind = kinds[from_entry, from_event]
        if kind == KIND_OWNED:
            await async_materialize(hass, store, to_entry, to_event, titles[to_entry])
        elif (
            kind == KIND_SHARED
            # a branch has no off switch of its own: a disabled one stays in the card
            and not records[from_entry, from_event].get("archived")
            and await _async_branch_free(hass, to_entry, to_event)
        ):
            await async_add_branch(hass, store, to_entry, to_event)

    _LOGGER.info(
        "moved %s",
        ", ".join(f"{s[0]}/{s[1]}→{d[0]}/{d[1]}" for s, d in moves.items()),
    )
    return {
        "moved": [source, target] if swapped else [source],
        "swapped": swapped,
        "entries": [source_entry_id, target_entry_id],
    }


async def _async_branch_free(
    hass: HomeAssistant, entry_id: str, action_id: str
) -> bool:
    """The remote has a shared automation with no branch yet for the event.

    A branch built in HA for the event is the user's; the moved actions
    then run from the card rather than replace it.
    """
    raw = await async_exists(hass, entry_id)
    if raw is None:
        return False
    return find_branch(_normalized(raw), action_id) is None

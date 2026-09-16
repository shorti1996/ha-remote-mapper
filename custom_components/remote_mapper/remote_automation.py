# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""One automation per remote — the importer's "Shape A" (plan ai/06).

One automation, one trigger per event with ``id: <action_id>``, a single
``choose`` whose branches are keyed on ``condition: trigger``. HA's own
docs recommend this shape for one automation with many triggers, and it
is what the IKEA-style blueprints produce, so users know the look.

The automation is canonical. Nothing here caches it: every read resolves
a slot's branch by trigger id, with a fallback that maps triggers to
events by what they intrinsically match (subtype / payload / event type)
so a renamed id still resolves. Add/remove touch only the one trigger
and branch keyed to an event; anything the user restructured is left
alone.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.exceptions import HomeAssistantError

from .const import AUTOMATION_ALIAS_PREFIX, DOMAIN, MANAGED_DESCRIPTION_MARKER
from .materializer import _get_config_store
from .store import default_slot

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)


def remote_automation_config_id(entry_id: str) -> str:
    """Deterministic id of a remote's shared automation."""
    return f"{DOMAIN}_{entry_id}"


def is_shared(slot: dict[str, Any] | None) -> bool:
    """Slot points at the remote's shared automation (one branch of it)."""
    return bool(slot and slot.get("materialized") and slot.get("shared_automation"))


# ── pure helpers over a raw automation config ──────────────────────


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def _normalized(raw: dict[str, Any]) -> dict[str, Any]:
    """Payload with plural keys and no id — safe to mutate and upsert."""
    payload = {k: v for k, v in raw.items() if k != "id"}
    payload["triggers"] = _as_list(
        payload.pop("triggers", payload.pop("trigger", None))
    )
    payload["conditions"] = _as_list(
        payload.pop("conditions", payload.pop("condition", None))
    )
    payload["actions"] = _as_list(payload.pop("actions", payload.pop("action", None)))
    return payload


def _intrinsic_action(trigger: dict[str, Any]) -> str | None:
    """What event a trigger matches by itself, ignoring its id."""
    platform = trigger.get("trigger", trigger.get("platform"))
    if platform == "device":
        subtype = trigger.get("subtype")
        return str(subtype) if subtype is not None else None
    if platform == "mqtt":
        payload = trigger.get("payload")
        return payload if isinstance(payload, str) else None
    if platform == "event.received":
        events = _as_list((trigger.get("options") or {}).get("event_type"))
        return str(events[0]) if len(events) == 1 else None
    return None


def _trigger_ids_for(triggers: list[Any], action_id: str) -> set[str]:
    """Ids (explicit or positional) of the triggers standing for an event."""
    ids: set[str] = set()
    for index, trigger in enumerate(triggers):
        if not isinstance(trigger, dict):
            continue
        trigger_id = str(trigger.get("id", index))
        if trigger_id == action_id or _intrinsic_action(trigger) == action_id:
            ids.add(trigger_id)
    return ids


def _branch_trigger_ids(option: dict[str, Any]) -> list[str] | None:
    """Trigger ids of a branch keyed on ``condition: trigger``; None otherwise."""
    conditions = _as_list(option.get("conditions", option.get("condition")))
    if len(conditions) != 1:
        return None
    condition = conditions[0]
    if not isinstance(condition, dict) or condition.get("condition") != "trigger":
        return None
    return [str(i) for i in _as_list(condition.get("id"))]


def _choose_step(payload: dict[str, Any]) -> dict[str, Any] | None:
    """The single choose step of a Shape A automation, else None."""
    actions = _as_list(payload.get("actions", payload.get("action")))
    if len(actions) != 1 or not isinstance(actions[0], dict):
        return None
    step = actions[0]
    if "choose" not in step:
        return None
    options = _as_list(step.get("choose"))
    if not any(isinstance(o, dict) and _branch_trigger_ids(o) for o in options):
        return None  # a choose over something else — not our shape
    return step


def build_branch(action_id: str, sequence: list[Any]) -> dict[str, Any]:
    """Branch keyed on the event's trigger id."""
    return {
        "conditions": [{"condition": "trigger", "id": action_id}],
        "sequence": list(sequence),
    }


def build_remote_payload(
    title: str,
    triggers: dict[str, dict[str, Any]],
    sequences: dict[str, list[Any]],
) -> dict[str, Any]:
    """Shape A payload: one trigger + one branch per event, in order."""
    return {
        "alias": f"{AUTOMATION_ALIAS_PREFIX} {title}",
        "description": (
            f"{MANAGED_DESCRIPTION_MARKER} One branch per button event; "
            "edits here are canonical. Clearing a button in the remote card "
            "removes its branch."
        ),
        "triggers": [
            {**trigger, "id": action_id} for action_id, trigger in triggers.items()
        ],
        "conditions": [],
        "actions": [
            {
                "choose": [
                    build_branch(action_id, sequences.get(action_id, []))
                    for action_id in triggers
                ]
            }
        ],
        # buttons are independent — a held button must not block a tap
        "mode": "parallel",
        "max": 10,
    }


def find_branch(payload: dict[str, Any], action_id: str) -> int | None:
    """Index of the branch for an event, or None."""
    choose = _choose_step(payload)
    if choose is None:
        return None
    ids = _trigger_ids_for(
        _as_list(payload.get("triggers", payload.get("trigger"))), action_id
    )
    if not ids:
        return None
    for index, option in enumerate(_as_list(choose.get("choose"))):
        if not isinstance(option, dict):
            continue
        branch_ids = _branch_trigger_ids(option)
        if branch_ids and ids.intersection(branch_ids):
            return index
    return None


def branch_view(payload: dict[str, Any], action_id: str) -> dict[str, Any] | None:
    """Per-event view of a Shape A automation; None for other shapes.

    Works for the shared automation and for imported Shape A automations
    linked through the import wizard alike.
    """
    choose = _choose_step(payload)
    if choose is None:
        return None
    index = find_branch(payload, action_id)
    if index is None:
        return {"actions": [], "branch_missing": True}
    option = _as_list(choose.get("choose"))[index]
    return {"actions": _as_list(option.get("sequence")), "branch_missing": False}


# ── store side ────────────────────────────────────────────────────


def _link_slot(
    store: RemoteMapperStore, entry_id: str, action_id: str, config_id: str
) -> None:
    slot = store.get_slot(entry_id, action_id) or default_slot()
    slot["materialized"] = True
    slot["automation_id"] = config_id
    slot["owned"] = True
    slot["shared_automation"] = True
    slot["sequence"] = []
    # imported_from is kept: the originals' chips stay visible
    store.async_set_slot(entry_id, action_id, slot)


async def async_exists(hass: HomeAssistant, entry_id: str) -> dict[str, Any] | None:
    """Raw config of the remote's shared automation, if it exists."""
    return await _get_config_store(hass).async_get(
        remote_automation_config_id(entry_id)
    )


async def async_create_remote_automation(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    title: str,
    action_ids: list[str],
) -> str:
    """Scaffold the shared automation for every given event.

    Card-built slots move their sequence into their branch. Slots that
    already have their own automation (materialized or linked) are left
    alone — they can be cleared and added later.
    """
    from .adapters import get_adapter

    remote = store.get_remote(entry_id)
    if remote is None:
        raise HomeAssistantError(f"Unknown remote {entry_id}")
    config_id = remote_automation_config_id(entry_id)
    adapter = get_adapter(remote["source"])

    triggers: dict[str, dict[str, Any]] = {}
    sequences: dict[str, list[Any]] = {}
    for action_id in action_ids:
        slot = store.get_slot(entry_id, action_id)
        if slot and slot.get("materialized") and slot.get("automation_id") != config_id:
            continue
        triggers[action_id] = adapter.build_trigger(action_id, remote["source_config"])
        sequences[action_id] = list(slot.get("sequence") or []) if slot else []
    if not triggers:
        raise HomeAssistantError("Every event already has its own automation")

    await _get_config_store(hass).async_upsert(
        config_id, build_remote_payload(title, triggers, sequences)
    )
    for action_id in triggers:
        _link_slot(store, entry_id, action_id, config_id)
    return config_id


async def async_add_branch(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
) -> str:
    """Append a trigger + branch for one event (grow as you go / re-add)."""
    from .adapters import get_adapter

    remote = store.get_remote(entry_id)
    if remote is None:
        raise HomeAssistantError(f"Unknown remote {entry_id}")
    config_id = remote_automation_config_id(entry_id)
    raw = await _get_config_store(hass).async_get(config_id)
    if raw is None:
        raise HomeAssistantError("The remote has no shared automation yet")

    payload = _normalized(raw)
    if find_branch(payload, action_id) is None:
        slot = store.get_slot(entry_id, action_id)
        sequence = list(slot.get("sequence") or []) if slot else []
        choose = _choose_step(payload)
        if choose is None:
            raise HomeAssistantError(
                "The shared automation was restructured in HA — add the branch there"
            )
        # The trigger may still be there (user deleted only the branch)
        existing = _trigger_ids_for(payload["triggers"], action_id)
        if existing:
            branch_id = sorted(existing)[0]
        else:
            trigger = get_adapter(remote["source"]).build_trigger(
                action_id, remote["source_config"]
            )
            payload["triggers"].append({**trigger, "id": action_id})
            branch_id = action_id
        choose["choose"] = [
            *_as_list(choose.get("choose")),
            build_branch(branch_id, sequence),
        ]
        await _get_config_store(hass).async_upsert(config_id, payload)

    _link_slot(store, entry_id, action_id, config_id)
    return config_id


async def async_set_branch_sequence(
    hass: HomeAssistant, entry_id: str, action_id: str, sequence: list[Any]
) -> None:
    """Replace one branch's actions (YAML-tab save on a shared slot)."""
    config_id = remote_automation_config_id(entry_id)
    raw = await _get_config_store(hass).async_get(config_id)
    if raw is None:
        raise HomeAssistantError("The shared automation no longer exists")
    payload = _normalized(raw)
    index = find_branch(payload, action_id)
    if index is None:
        raise HomeAssistantError("This event has no branch in the shared automation")
    _choose_step(payload)["choose"][index]["sequence"] = list(sequence)  # type: ignore[index]
    await _get_config_store(hass).async_upsert(config_id, payload)


async def async_remove_branch(
    hass: HomeAssistant, entry_id: str, action_id: str
) -> bool:
    """Drop one event's trigger + branch; delete the automation when empty.

    Returns True when the whole automation was deleted.
    """
    config_store = _get_config_store(hass)
    config_id = remote_automation_config_id(entry_id)
    raw = await config_store.async_get(config_id)
    if raw is None:
        return False
    payload = _normalized(raw)
    # Positional ids would shift after a removal — pin every id first
    for index, trigger in enumerate(payload["triggers"]):
        if isinstance(trigger, dict) and "id" not in trigger:
            trigger["id"] = str(index)
    ids = _trigger_ids_for(payload["triggers"], action_id)
    index = find_branch(payload, action_id)
    choose = _choose_step(payload)
    if choose is not None and index is not None:
        options = _as_list(choose.get("choose"))
        del options[index]
        choose["choose"] = options
    payload["triggers"] = [
        t
        for t in payload["triggers"]
        if not (isinstance(t, dict) and str(t.get("id")) in ids)
    ]
    remaining = _as_list(choose.get("choose")) if choose is not None else None
    if choose is not None and not remaining:
        await config_store.async_delete(config_id)
        return True
    await config_store.async_upsert(config_id, payload)
    return False


async def async_detach_branch(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    sequence: list[Any] | None,
) -> None:
    """Untick "automation" on a shared slot: branch → card, branch removed."""
    slot = store.get_slot(entry_id, action_id)
    if slot is None:
        raise HomeAssistantError(f"No slot {entry_id}/{action_id}")
    if sequence is None:
        raw = await async_exists(hass, entry_id)
        view = branch_view(_normalized(raw), action_id) if raw else None
        sequence = list(view["actions"]) if view else []
    await async_remove_branch(hass, entry_id, action_id)
    slot["sequence"] = sequence
    slot["materialized"] = False
    slot["automation_id"] = None
    slot["shared_automation"] = False
    store.async_set_slot(entry_id, action_id, slot)

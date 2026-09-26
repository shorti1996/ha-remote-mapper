# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""In-process automations.yaml management (materialization).

Replicates what the native editor's admin-only HTTP view does
(config/view.py + config/automation.py) because backend code cannot call
those views: load yaml → upsert/delete by id → atomic write → targeted
automation.reload. One asyncio.Lock serializes our writes; the small race
window against simultaneous UI edits is accepted (plan §8.2).

Mode switch, not one-shot export: while materialized the automation is
canonical — the slot store keeps only a pointer.
"""

from __future__ import annotations

import asyncio
import copy
import logging
import shutil
from pathlib import Path
from typing import TYPE_CHECKING, Any

from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA
from homeassistant.components.automation.config import async_validate_config_item
from homeassistant.config import AUTOMATION_CONFIG_PATH
from homeassistant.const import CONF_ID, SERVICE_RELOAD
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util.file import write_utf8_file_atomic
from homeassistant.util.yaml import dump, load_yaml

from .const import DOMAIN, MANAGED_DESCRIPTION_MARKER
from .naming import event_label, managed_alias, plain_alias

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)

AUTOMATION_DOMAIN = "automation"
EDIT_URL = "/config/automation/edit/{}"


def automation_config_id(entry_id: str, action_id: str) -> str:
    """Deterministic automation id for a slot — idempotent re-materialize."""
    return f"{DOMAIN}_{entry_id}_{action_id}"


def build_payload(
    alias: str,
    trigger: dict[str, Any],
    sequence: list[Any],
) -> dict[str, Any]:
    """Automation payload — plural keys (2024.10+ editor convention)."""
    return {
        "alias": alias,
        "description": (
            f"{MANAGED_DESCRIPTION_MARKER} Edits here are canonical. "
            "Disable the toggle in the remote card to remove."
        ),
        "triggers": [trigger],
        "conditions": [],
        "actions": sequence,
        "mode": "single",
    }


class AutomationConfigStore:
    """Serialized in-process reads/writes of automations.yaml."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize."""
        self.hass = hass
        self._lock = asyncio.Lock()
        self._path = hass.config.path(AUTOMATION_CONFIG_PATH)

    def _read_sync(self) -> list[dict[str, Any]]:
        try:
            data = load_yaml(self._path)
        except FileNotFoundError:
            return []
        # load_yaml returns {} for an empty file
        if data is None or data == {}:
            return []
        if not isinstance(data, list):
            # NEVER coerce unexpected content to [] — a later write would
            # destroy the user's automations. Refuse to touch the file.
            raise HomeAssistantError(
                f"{self._path} does not contain a list — refusing to modify it"
            )
        return data

    def _write_sync(self, data: list[dict[str, Any]]) -> None:
        # Last-known-good sidecar: one pre-write copy, cheap insurance
        # against read/serialize bugs eating hand-written config.
        try:
            existing = Path(self._path)
            if existing.is_file() and existing.stat().st_size > 3:
                shutil.copyfile(self._path, f"{self._path}.remote_mapper_backup")
        except OSError:
            _LOGGER.warning("Could not write backup for %s", self._path)
        write_utf8_file_atomic(self._path, dump(data))

    async def async_get(self, config_id: str) -> dict[str, Any] | None:
        """Live entity raw_config preferred; file fallback.

        The live config is deep-copied: callers edit nested branches in
        place, and a targeted reload skips an automation whose raw_config
        already equals the new one — the old actions would keep running.
        """
        if (component := self.hass.data.get(AUTOMATION_DATA)) is not None:
            for entity in component.entities:
                if entity.unique_id == config_id and entity.raw_config is not None:
                    return copy.deepcopy(dict(entity.raw_config))
        async with self._lock:
            data = await self.hass.async_add_executor_job(self._read_sync)
        for item in data:
            if item.get(CONF_ID) == config_id:
                return dict(item)
        return None

    async def async_upsert(self, config_id: str, payload: dict[str, Any]) -> None:
        """Validate, upsert by id (foreign entries untouched), reload.

        A new automation is switched on: HA gives it the last state of a
        deleted one with the same entity id, which can be off.
        """
        await async_validate_config_item(self.hass, config_id, dict(payload))
        new_value = {CONF_ID: config_id, **payload}
        async with self._lock:
            data = await self.hass.async_add_executor_job(self._read_sync)
            for index, item in enumerate(data):
                if item.get(CONF_ID) == config_id:
                    data[index] = new_value
                    created = False
                    break
            else:
                data.append(new_value)
                created = True
            await self.hass.async_add_executor_job(self._write_sync, data)
        # Targeted reload — same as the view's post_write_hook
        await self.hass.services.async_call(
            AUTOMATION_DOMAIN, SERVICE_RELOAD, {CONF_ID: config_id}, blocking=True
        )
        entity_id = automation_entity_id(self.hass, config_id) if created else None
        state = self.hass.states.get(entity_id) if entity_id else None
        if state is not None and state.state == "off":
            await self.hass.services.async_call(
                AUTOMATION_DOMAIN, "turn_on", {"entity_id": entity_id}, blocking=True
            )

    async def async_delete(self, config_id: str) -> bool:
        """Remove entry from yaml + drop the registry entity."""
        removed = False
        async with self._lock:
            data = await self.hass.async_add_executor_job(self._read_sync)
            filtered = [item for item in data if item.get(CONF_ID) != config_id]
            if len(filtered) != len(data):
                removed = True
                await self.hass.async_add_executor_job(self._write_sync, filtered)
        registry = er.async_get(self.hass)
        if entity_id := registry.async_get_entity_id(
            AUTOMATION_DOMAIN, AUTOMATION_DOMAIN, config_id
        ):
            registry.async_remove(entity_id)
        return removed


def _get_config_store(hass: HomeAssistant) -> AutomationConfigStore:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if "automation_config_store" not in domain_data:
        domain_data["automation_config_store"] = AutomationConfigStore(hass)
    return domain_data["automation_config_store"]


def automation_entity_id(hass: HomeAssistant, config_id: str) -> str | None:
    """Map config id → entity id (deep-links use config id, services entity id)."""
    return er.async_get(hass).async_get_entity_id(
        AUTOMATION_DOMAIN, AUTOMATION_DOMAIN, config_id
    )


async def async_materialize(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    title: str,
    auto_name: str | None = None,
) -> str:
    """Create/update the slot's automation; returns the config id.

    The alias names the event by the slot name, else ``auto_name`` (the
    name the card inferred from the actions), else the button label. An
    update with neither keeps the alias the automation already has, so a
    re-snapshot doesn't undo a rename made in HA.

    A new automation gets the event's id, or ``<id>_2``… when that is
    taken — by an automation kept on clear, which is the user's now.
    """
    from .adapters import get_adapter

    remote = store.get_remote(entry_id)
    slot = store.get_slot(entry_id, action_id)
    if remote is None or slot is None:
        raise HomeAssistantError(f"No slot {entry_id}/{action_id} to materialize")

    adapter = get_adapter(remote["source"])
    trigger = adapter.build_trigger(action_id, remote["source_config"])
    config_store = _get_config_store(hass)
    config_id = slot.get("automation_id") if slot.get("materialized") else None
    if not config_id:
        config_id = base = automation_config_id(entry_id, action_id)
        n = 1
        while await config_store.async_get(config_id) is not None:
            n += 1
            config_id = f"{base}_{n}"
    name = slot.get("name") or auto_name
    existing = None if name else await config_store.async_get(config_id)
    alias = (existing or {}).get("alias") or managed_alias(
        title, event_label(remote, action_id, name)
    )
    payload = build_payload(alias, trigger, slot["sequence"])

    await config_store.async_upsert(config_id, payload)
    # an archived slot stays silent: its automation is switched off
    if slot.get("archived") and (entity_id := automation_entity_id(hass, config_id)):
        await hass.services.async_call(
            AUTOMATION_DOMAIN, "turn_off", {"entity_id": entity_id}, blocking=True
        )

    slot["materialized"] = True
    slot["automation_id"] = config_id
    slot["owned"] = True
    store.async_set_slot(entry_id, action_id, slot)
    return config_id


def is_linked(slot: dict[str, Any] | None) -> bool:
    """Materialized onto a native automation we did not create."""
    return bool(
        slot and slot.get("materialized") and slot.get("automation_id")
    ) and not slot.get("owned", True)


async def async_link(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    config_id: str,
) -> None:
    """Point the slot at an existing native automation (link mode).

    Nothing is copied or disabled: the automation stays canonical and
    keeps firing on its own trigger; the dispatcher skips the slot.
    """
    from .store import default_slot

    if await _get_config_store(hass).async_get(config_id) is None:
        raise HomeAssistantError(f"Automation {config_id} not found")
    slot = store.get_slot(entry_id, action_id) or default_slot()
    slot["materialized"] = True
    slot["automation_id"] = config_id
    slot["owned"] = False
    slot["sequence"] = []
    slot["scene_id"] = None
    slot["shared_automation"] = False
    # imported_from is kept on purpose: the originals' chips stay visible
    store.async_set_slot(entry_id, action_id, slot)
    await _async_reenable_if_ours(hass, store, entry_id, action_id, config_id)


async def _async_reenable_if_ours(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    config_id: str,
) -> None:
    """Turn a just-linked automation back on if this remote switched it off.

    Absorb → Clear → Link (import's default) otherwise points the button
    at an automation that never fires, and hand-back leaves it off for
    good. It stays off while another slot still runs an absorbed copy —
    both would fire on the press.
    """
    from .release import imported_sources

    remote = store.get_remote(entry_id)
    entity_id = automation_entity_id(hass, config_id)
    if remote is None or entity_id is None:
        return

    def _is_it(source: dict[str, Any]) -> bool:
        return source.get("entity_id") == entity_id or (
            source.get("config_id") == config_id
        )

    ours = any(_is_it(s) for s in store.disabled_originals(entry_id))
    for other_id, other in remote.get("slots", {}).items():
        if not any(_is_it(s) for s in imported_sources(other)):
            continue
        if other_id != action_id and not other.get("materialized"):
            return  # an absorbed copy still runs on another event
        ours = True  # import trail from before disabled_originals existed
    if not ours:
        return
    state = hass.states.get(entity_id)
    if state is not None and state.state == "off":
        await hass.services.async_call(
            AUTOMATION_DOMAIN, "turn_on", {"entity_id": entity_id}, blocking=True
        )
        _LOGGER.info("%s: re-enabled %s on link", DOMAIN, entity_id)
    store.async_forget_disabled(entry_id, [entity_id])


async def async_absorb_link(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    sequence: list[Any] | None = None,
) -> list[str]:
    """Unlink: copy the automation's actions into the card, disable it.

    Same footprint as an absorbing import — the original is disabled
    (never deleted) and remembered in imported_from for hand-back.
    ``sequence`` (already validated) replaces this event's live actions.

    A per-remote automation (one choose branch per event) can only be
    turned off as a whole, so every event it runs on this remote gets its
    own branch in the same step. Returns the events absorbed.
    """
    from .store import default_slot

    slot = store.get_slot(entry_id, action_id)
    if not is_linked(slot):
        raise HomeAssistantError(f"Slot {entry_id}/{action_id} is not linked")
    config_id = slot["automation_id"]
    raw = await _get_config_store(hass).async_get(config_id)
    if raw is None:
        raise HomeAssistantError(f"Automation {config_id} no longer exists")
    entity_id = automation_entity_id(hass, config_id)
    alias = raw.get("alias") or entity_id or config_id

    plan = whole_automation_plan(store, entry_id, raw)
    if plan is None:
        copies = {
            action_id: (
                list(raw.get("actions", raw.get("action", [])) or []),
                absorbed_name(raw, action_id),
            )
        }
    else:
        if plan["blocked"]:
            raise HomeAssistantError(
                f'"{alias}" can\'t move into the card: {plan["blocked"]}. '
                "Edit it in HA instead."
            )
        events = list(dict.fromkeys([*plan["events"], action_id]))
        taken = [
            event
            for event in events
            if not _free_for_absorb(store.get_slot(entry_id, event), config_id)
        ]
        if taken:
            raise HomeAssistantError(
                f'"{alias}" also runs {", ".join(taken)}, which already have '
                "their own action here. Clear those events first, or edit the "
                "automation in HA."
            )
        from .remote_automation import branch_view

        copies = {}
        for event in events:
            view = branch_view(raw, event) or {}
            copies[event] = (list(view.get("actions") or []), view.get("alias"))
    if sequence is not None:
        copies[action_id] = (list(sequence), copies[action_id][1])

    origin = {"entity_id": entity_id, "config_id": config_id}
    for event, (actions, name) in copies.items():
        target = store.get_slot(entry_id, event) or default_slot()
        target["sequence"] = actions
        target["materialized"] = False
        target["automation_id"] = None
        target["owned"] = True
        target["imported_from"] = {**origin, "sources": [dict(origin)]}
        if not target.get("name"):
            target["name"] = name
        store.async_set_slot(entry_id, event, target)
    if entity_id:
        await hass.services.async_call(
            AUTOMATION_DOMAIN, "turn_off", {"entity_id": entity_id}, blocking=True
        )
        store.async_remember_disabled(entry_id, [origin])
    return list(copies)


def _free_for_absorb(slot: dict[str, Any] | None, config_id: str) -> bool:
    """Empty, or linked to the automation being absorbed."""
    return slot is None or (is_linked(slot) and slot["automation_id"] == config_id)


def whole_automation_plan(
    store: RemoteMapperStore, entry_id: str, raw: dict[str, Any]
) -> dict[str, Any] | None:
    """per_remote_plan() over this remote's events; None for other shapes."""
    from .remote_automation import per_remote_plan

    remote = store.get_remote(entry_id) or {}
    return per_remote_plan(
        raw,
        list(remote.get("layout", {}).get("actions", [])),
        (remote.get("source_config") or {}).get("device_id"),
    )


def linked_events(store: RemoteMapperStore, entry_id: str, config_id: str) -> list[str]:
    """This remote's events linked to one native automation."""
    remote = store.get_remote(entry_id) or {}
    return [
        action_id
        for action_id, slot in remote.get("slots", {}).items()
        if is_linked(slot) and slot["automation_id"] == config_id
    ]


def absorbed_name(raw: dict[str, Any], action_id: str) -> str | None:
    """Slot name for an absorbed automation: its alias, when it is per-event.

    A per-remote automation (one choose branch per event) names the whole
    remote, so its alias would label every button the same.
    """
    from .remote_automation import branch_view

    alias = str(raw.get("alias") or "").strip()
    if not alias or branch_view(raw, action_id) is not None:
        return None
    return alias


async def async_unmanage(hass: HomeAssistant, config_id: str) -> bool:
    """Turn a managed automation into a plain one (release flow).

    Keeps triggers/actions; drops our tag from the alias and strips the
    auto-managed description. False if the automation no longer exists.
    """
    store = _get_config_store(hass)
    raw = await store.async_get(config_id)
    if raw is None:
        return False
    payload = {k: v for k, v in raw.items() if k != "id"}
    payload["alias"] = plain_alias(payload.get("alias") or config_id)
    description = str(payload.get("description", ""))
    if MANAGED_DESCRIPTION_MARKER in description:
        payload["description"] = ""
    await store.async_upsert(config_id, payload)
    return True


async def async_get_live_view(
    hass: HomeAssistant,
    slot: dict[str, Any],
    action_id: str | None = None,
    store: RemoteMapperStore | None = None,
    entry_id: str | None = None,
) -> dict[str, Any] | None:
    """Summary of the materialized automation for the card.

    With ``action_id``, a single-choose automation keyed on trigger ids
    (the remote's shared automation, or an imported "Shape A" one) is
    narrowed to this event's branch. With ``store`` and ``entry_id``, a
    linked one also carries ``whole``: what unticking or disabling one
    event does to the others (the automation only goes off as a whole).
    """
    from .remote_automation import branch_view

    config_id = slot.get("automation_id")
    if not config_id:
        return None
    raw = await _get_config_store(hass).async_get(config_id)
    if raw is None:
        return None
    entity_id = automation_entity_id(hass, config_id)
    state = hass.states.get(entity_id) if entity_id else None
    view = {
        "config_id": config_id,
        "entity_id": entity_id,
        "alias": raw.get("alias"),
        "actions": raw.get("actions", raw.get("action", [])),
        "edit_url": EDIT_URL.format(config_id),
        "owned": slot.get("owned", True),
        "state": state.state if state else None,
        "branch": False,
        "branch_missing": False,
    }
    if action_id is not None and (branch := branch_view(raw, action_id)) is not None:
        view["actions"] = branch["actions"]
        view["branch"] = True
        view["branch_missing"] = branch["branch_missing"]
        view["branch_alias"] = branch["alias"]
        if store is not None and entry_id and is_linked(slot):
            plan = whole_automation_plan(store, entry_id, raw) or {}
            view["whole"] = {
                "events": list(dict.fromkeys([*plan.get("events", []), action_id])),
                "linked": linked_events(store, entry_id, config_id),
                "foreign": plan.get("foreign", False),
                "blocked": plan.get("blocked"),
            }
    return view


async def async_dematerialize(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
    sequence: list[Any] | None,
    delete_automation: bool = True,
) -> None:
    """Fold the automation back into the store.

    sequence=None pulls the automation's current actions (the external
    edits are canonical). M5 wires delete_automation to the
    owned_scene_cleanup policy; disabled-not-deleted keeps the automation
    but drops our pointer.
    """
    slot = store.get_slot(entry_id, action_id)
    if slot is None:
        raise HomeAssistantError(f"No slot {entry_id}/{action_id}")
    config_id = slot.get("automation_id")

    if sequence is None:
        sequence = []
        if config_id and (raw := await _get_config_store(hass).async_get(config_id)):
            actions = raw.get("actions", raw.get("action", []))
            sequence = actions if isinstance(actions, list) else [actions]

    if config_id:
        if delete_automation:
            await _get_config_store(hass).async_delete(config_id)
        elif entity_id := automation_entity_id(hass, config_id):
            await hass.services.async_call(
                AUTOMATION_DOMAIN, "turn_off", {"entity_id": entity_id}, blocking=True
            )

    slot["sequence"] = sequence
    slot["materialized"] = False
    slot["automation_id"] = None
    store.async_set_slot(entry_id, action_id, slot)


async def async_check_orphans(
    hass: HomeAssistant, store: RemoteMapperStore, entry_id: str
) -> list[str]:
    """Reset slots whose automation vanished (deleted behind our back)."""
    remote = store.get_remote(entry_id)
    if remote is None:
        return []
    orphaned: list[str] = []
    for action_id, slot in remote.get("slots", {}).items():
        if not slot.get("materialized"):
            continue
        config_id = slot.get("automation_id")
        if config_id and await _get_config_store(hass).async_get(config_id):
            continue
        slot["materialized"] = False
        slot["automation_id"] = None
        store.async_set_slot(entry_id, action_id, slot)
        orphaned.append(action_id)
    if orphaned:
        _LOGGER.warning(
            "Remote %s: automations for %s vanished — slots reset to card-only",
            entry_id,
            orphaned,
        )
    return orphaned

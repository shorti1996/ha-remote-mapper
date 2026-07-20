"""Import assistant — absorb existing button automations into slots.

Two observed shapes (plan §5):

- **Shape A**: one automation, N device triggers with `id:`, a single
  `choose` keyed on `condition: trigger` → one slot per trigger id,
  branch sequence verbatim.
- **Shape B**: one automation per button, flat actions → single slot,
  whole action list = sequence.

Anything else is flagged for manual YAML-tier import — never silently
dropped. Originals are disabled (automation.turn_off), not deleted.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.automation import (
    DATA_COMPONENT as AUTOMATION_DATA,
)
from homeassistant.components.automation import (
    automations_with_device,
)
from homeassistant.const import ATTR_ENTITY_ID

from .const import AUTOMATION_ALIAS_PREFIX, DOMAIN, MANAGED_DESCRIPTION_MARKER

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)


def _as_list(value: Any) -> list[Any]:
    """Normalize HA's list-or-single-dict config style."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _normalized(raw: dict[str, Any]) -> tuple[list[dict], list[dict], list[dict]]:
    """Return (triggers, conditions, actions), accepting legacy singular keys."""
    triggers = _as_list(raw.get("triggers", raw.get("trigger")))
    conditions = _as_list(raw.get("conditions", raw.get("condition")))
    actions = _as_list(raw.get("actions", raw.get("action")))
    return triggers, conditions, actions


def _is_our_device_trigger(trigger: dict[str, Any], device_id: str) -> bool:
    platform = trigger.get("trigger", trigger.get("platform"))
    return platform == "device" and trigger.get("device_id") == device_id


def _trigger_id_map(triggers: list[dict[str, Any]], device_id: str) -> dict[str, str]:
    """Map trigger id (explicit or positional) → subtype (= action_id)."""
    id_map: dict[str, str] = {}
    for idx, trigger in enumerate(triggers):
        if not _is_our_device_trigger(trigger, device_id):
            continue
        if (subtype := trigger.get("subtype")) is None:
            continue
        id_map[str(trigger.get("id", idx))] = str(subtype)
    return id_map


def _branch_trigger_ids(option: dict[str, Any]) -> list[str] | None:
    """Extract trigger ids from a choose branch keyed on condition: trigger."""
    conditions = _as_list(option.get("conditions", option.get("condition")))
    if len(conditions) != 1:
        return None
    condition = conditions[0]
    if not isinstance(condition, dict) or condition.get("condition") != "trigger":
        return None
    ids = condition.get("id")
    if ids is None:
        return None
    return [str(i) for i in _as_list(ids)]


class ImportScanner:
    """Scan a remote's device for importable automations."""

    def __init__(self, hass: HomeAssistant, entry_id: str, device_id: str) -> None:
        """Initialize."""
        self.hass = hass
        self.entry_id = entry_id
        self.device_id = device_id
        self.proposals: list[dict[str, Any]] = []
        self.skipped: list[dict[str, Any]] = []

    def scan(self, store: RemoteMapperStore) -> dict[str, Any]:
        """Classify every automation touching the device."""
        component = self.hass.data.get(AUTOMATION_DATA)
        if component is None:
            return {"proposals": [], "skipped": []}

        for entity_id in automations_with_device(self.hass, self.device_id):
            entity = component.get_entity(entity_id)
            if entity is None or entity.raw_config is None:
                self._skip(entity_id, None, "no_raw_config")
                continue
            raw = dict(entity.raw_config)
            alias = raw.get("alias") or entity_id
            if str(alias).startswith(AUTOMATION_ALIAS_PREFIX) or (
                MANAGED_DESCRIPTION_MARKER in str(raw.get("description", ""))
            ):
                continue  # our own materialized automation — not an import
            self._classify(entity_id, alias, raw, store)

        return {"proposals": self.proposals, "skipped": self.skipped}

    # ── internals ────────────────────────────────────────────────────

    def _skip(self, entity_id: str, alias: str | None, reason: str) -> None:
        self.skipped.append(
            {"entity_id": entity_id, "alias": alias or entity_id, "reason": reason}
        )

    def _classify(
        self,
        entity_id: str,
        alias: str,
        raw: dict[str, Any],
        store: RemoteMapperStore,
    ) -> None:
        triggers, conditions, actions = _normalized(raw)
        config_id = raw.get("id")  # absent in hand-written yaml without id:
        id_map = _trigger_id_map(triggers, self.device_id)
        if not id_map:
            self._skip(entity_id, alias, "no_subtype_triggers")
            return
        mixed = any(not _is_our_device_trigger(t, self.device_id) for t in triggers)
        if conditions:
            self._skip(entity_id, alias, "top_level_conditions")
            return

        base = {
            "source_entity_id": entity_id,
            "source_config_id": config_id,
            "alias": alias,
            # Mixed-remote automations keep firing for the other devices —
            # import matching branches only, never disable the source.
            "disable_source": not mixed,
            "mixed": mixed,
        }

        is_single_choose = (
            len(actions) == 1
            and isinstance(actions[0], dict)
            and "choose" in actions[0]
        )
        if is_single_choose:
            self._classify_choose(entity_id, alias, actions[0], id_map, base, store)
            return

        # Shape B: flat actions, exactly one of our subtypes triggering
        subtypes = set(id_map.values())
        if len(subtypes) == 1 and not mixed:
            self._propose(next(iter(subtypes)), actions, base, store)
            return
        self._skip(
            entity_id,
            alias,
            "mixed_remote_flat_actions" if mixed else "multi_trigger_flat_actions",
        )

    def _classify_choose(
        self,
        entity_id: str,
        alias: str,
        choose_step: dict[str, Any],
        id_map: dict[str, str],
        base: dict[str, Any],
        store: RemoteMapperStore,
    ) -> None:
        if _as_list(choose_step.get("default")):
            self._skip(entity_id, alias, "choose_has_default")
            return
        options = _as_list(choose_step.get("choose"))
        proposed_any = False
        flagged_any = False
        for option in options:
            trigger_ids = _branch_trigger_ids(option)
            if trigger_ids is None:
                self._skip(entity_id, alias, "branch_not_trigger_keyed")
                flagged_any = True
                continue
            sequence = _as_list(option.get("sequence"))
            for trigger_id in trigger_ids:
                if (action_id := id_map.get(trigger_id)) is None:
                    # Branch for another device in a mixed automation
                    continue
                self._propose(action_id, sequence, base, store)
                proposed_any = True
        if not proposed_any and not flagged_any:
            self._skip(entity_id, alias, "no_matching_branches")

    def _propose(
        self,
        action_id: str,
        sequence: list[Any],
        base: dict[str, Any],
        store: RemoteMapperStore,
    ) -> None:
        existing = store.get_slot(self.entry_id, action_id)
        self.proposals.append(
            {
                **base,
                "action_id": action_id,
                "sequence": sequence,
                "conflict": existing is not None,
            }
        )


async def async_apply(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    proposals: list[dict[str, Any]],
    overwrite: bool,
) -> dict[str, Any]:
    """Write proposals as slots; disable sources (never delete).

    Sequences are validated by the caller (websocket layer) before this
    runs. Returns applied/skipped action ids and disabled entity ids.
    """
    from .store import default_slot

    applied: list[str] = []
    conflicts: list[str] = []
    to_disable: set[str] = set()

    for proposal in proposals:
        action_id = proposal["action_id"]
        if store.get_slot(entry_id, action_id) is not None and not overwrite:
            conflicts.append(action_id)
            continue
        slot = default_slot()
        slot["sequence"] = proposal["sequence"]
        slot["imported_from"] = {
            "entity_id": proposal.get("source_entity_id"),
            "config_id": proposal.get("source_config_id"),
        }
        store.async_set_slot(entry_id, action_id, slot)
        applied.append(action_id)
        if proposal.get("disable_source") and proposal.get("source_entity_id"):
            to_disable.add(proposal["source_entity_id"])

    for entity_id in sorted(to_disable):
        await hass.services.async_call(
            "automation",
            "turn_off",
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
        )
        _LOGGER.info("%s: disabled imported source %s", DOMAIN, entity_id)

    return {"applied": applied, "conflicts": conflicts, "disabled": sorted(to_disable)}

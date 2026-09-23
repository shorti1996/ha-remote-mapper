# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Persistent slot store — single Store shared by all config entries.

Schema (design doc §4): remotes keyed by config entry id, plus the
owned-scenes ownership registry. Slot records are created lazily — an
absent key IS the Empty state.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Final

from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

STORAGE_KEY: Final = DOMAIN
STORAGE_VERSION: Final = 1
SAVE_DELAY: Final = 2.0

# Per-slot version for action-name drift handling (design doc §10)
SLOT_SCHEMA_VERSION: Final = 1


def default_slot() -> dict[str, Any]:
    """Return a fresh Assigned-state slot record."""
    return {
        "sequence": [],
        "name": None,
        "scene_id": None,
        "materialized": False,
        "automation_id": None,
        # materialized + owned=False → LINKED to a native automation we never
        # created: dispatcher skips (it fires itself), we never rename/delete
        "owned": True,
        "archived": False,
        "schema_version": SLOT_SCHEMA_VERSION,
        "updated_at": dt_util.utcnow().isoformat(),
        "last_run": None,
        "last_error": None,
    }


class RemoteMapperStore:
    """In-memory data with debounced persistence.

    Mutations update memory and call async_schedule_save(); writes are
    debounced via Store.async_delay_save (slot saves and canvas drags
    burst). async_flush() forces a write on entry unload.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize."""
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data: dict[str, Any] = {"remotes": {}, "owned_scenes": {}}

    async def async_load(self) -> None:
        """Load persisted data, keeping defaults when nothing stored yet."""
        if (data := await self._store.async_load()) is not None:
            self.data = data

    def async_schedule_save(self) -> None:
        """Schedule a debounced save."""
        self._store.async_delay_save(lambda: self.data, SAVE_DELAY)

    async def async_flush(self) -> None:
        """Write immediately (entry unload / HA stop)."""
        await self._store.async_save(self.data)

    # ── remotes ──────────────────────────────────────────────────────

    def get_remote(self, entry_id: str) -> dict[str, Any] | None:
        """Return the remote record, or None."""
        return self.data["remotes"].get(entry_id)

    def async_ensure_remote(
        self,
        entry_id: str,
        source: str,
        source_config: dict[str, Any],
        layout: dict[str, Any],
    ) -> dict[str, Any]:
        """Create or refresh the remote record; slots are preserved."""
        remote = self.data["remotes"].setdefault(
            entry_id,
            {
                "slots": {},
                "snapshot_entities": [],
                "card_layout": None,
                "grid_layout": None,
            },
        )
        remote["source"] = source
        remote["source_config"] = source_config
        remote["layout"] = layout
        self.async_schedule_save()
        return remote

    def async_remove_remote(self, entry_id: str) -> None:
        """Drop a remote and all its slots (config entry removal)."""
        if self.data["remotes"].pop(entry_id, None) is not None:
            self.async_schedule_save()

    # ── slots ────────────────────────────────────────────────────────

    def get_slot(self, entry_id: str, action_id: str) -> dict[str, Any] | None:
        """Return the slot record, or None (= Empty state)."""
        remote = self.get_remote(entry_id)
        if remote is None:
            return None
        return remote["slots"].get(action_id)

    def async_set_slot(
        self, entry_id: str, action_id: str, slot: dict[str, Any]
    ) -> None:
        """Write a slot record (Assigned state)."""
        remote = self.data["remotes"][entry_id]
        slot["updated_at"] = dt_util.utcnow().isoformat()
        remote["slots"][action_id] = slot
        self.async_schedule_save()

    def async_clear_slot(self, entry_id: str, action_id: str) -> None:
        """Remove a slot record (back to Empty)."""
        remote = self.get_remote(entry_id)
        if remote and remote["slots"].pop(action_id, None) is not None:
            self.async_schedule_save()

    # ── originals switched off by import/absorb ──────────────────────

    def disabled_originals(self, entry_id: str) -> list[dict[str, Any]]:
        """Automations this remote turned off and has not turned back on.

        Kept on the remote, not the slot: clearing an absorbed slot must
        not make hand-back or a later link forget the original is off.
        """
        remote = self.get_remote(entry_id)
        return list(remote.get("disabled_originals", [])) if remote else []

    def async_remember_disabled(
        self, entry_id: str, sources: list[dict[str, Any]]
    ) -> None:
        """Record originals just turned off ({entity_id, config_id})."""
        known = self.data["remotes"][entry_id].setdefault("disabled_originals", [])
        seen = {item["entity_id"] for item in known}
        for source in sources:
            if (entity_id := source.get("entity_id")) and entity_id not in seen:
                known.append(
                    {"entity_id": entity_id, "config_id": source.get("config_id")}
                )
                seen.add(entity_id)
        self.async_schedule_save()

    def async_forget_disabled(self, entry_id: str, entity_ids: list[str]) -> None:
        """Drop originals that are back on."""
        remote = self.get_remote(entry_id)
        if not remote or not remote.get("disabled_originals"):
            return
        remote["disabled_originals"] = [
            item
            for item in remote["disabled_originals"]
            if item["entity_id"] not in entity_ids
        ]
        self.async_schedule_save()

    # ── owned scenes (ownership registry, design §7) ─────────────────

    def get_owned_scene(self, scene_id: str) -> dict[str, Any] | None:
        """Registry entry for a scene created by this integration."""
        return self.data["owned_scenes"].get(scene_id)

    def async_register_owned_scene(
        self, scene_id: str, created_for: str, entities: list[str]
    ) -> None:
        """Record ownership; entities enable in-place re-snapshot."""
        self.data["owned_scenes"][scene_id] = {
            "created_for": created_for,
            "created_at": dt_util.utcnow().isoformat(),
            "entities": entities,
        }
        self.async_schedule_save()

    def async_drop_owned_scene(self, scene_id: str) -> None:
        """Drop ownership (scene becomes indistinguishable from hand-made)."""
        if self.data["owned_scenes"].pop(scene_id, None) is not None:
            self.async_schedule_save()

    def owned_scenes_for(self, entry_id: str) -> list[str]:
        """Owned scene ids belonging to one remote."""
        prefix = f"{entry_id}/"
        return [
            scene_id
            for scene_id, record in self.data["owned_scenes"].items()
            if record.get("created_for", "").startswith(prefix)
        ]

    def async_record_run(
        self, entry_id: str, action_id: str, error: str | None
    ) -> None:
        """Record dispatch outcome on the slot (surfaced in the card)."""
        slot = self.get_slot(entry_id, action_id)
        if slot is None:
            return
        slot["last_run"] = dt_util.utcnow().isoformat()
        slot["last_error"] = error
        self.async_schedule_save()

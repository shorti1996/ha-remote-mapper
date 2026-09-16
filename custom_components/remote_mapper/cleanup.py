"""Owned-artifact cleanup policy (design §7).

A slot may own two kinds of artifacts: a snapshot scene (tracked in the
owned_scenes registry) and a materialized automation (integration-owned
by definition). One remembered choice — ask / always_delete /
never_delete — covers both. Hand-made scenes assigned to slots are
never listed, prompted about, or touched.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from .const import (
    CLEANUP_ALWAYS_DELETE,
    CLEANUP_ASK,
    CLEANUP_NEVER_DELETE,
    CONF_OWNED_SCENE_CLEANUP,
)
from .scene_api import get_scene_config_store, scene_entity_id

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

    from .store import RemoteMapperStore

DECISION_DELETE = "delete"
DECISION_KEEP = "keep"


def get_policy(entry: ConfigEntry | None) -> str:
    """Current cleanup policy from entry options."""
    if entry is None:
        return CLEANUP_ASK
    return entry.options.get(CONF_OWNED_SCENE_CLEANUP, CLEANUP_ASK)


def async_remember_policy(
    hass: HomeAssistant, entry: ConfigEntry, decision: str
) -> None:
    """Persist "remember my choice" (resettable in the options flow)."""
    policy = (
        CLEANUP_ALWAYS_DELETE if decision == DECISION_DELETE else CLEANUP_NEVER_DELETE
    )
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, CONF_OWNED_SCENE_CLEANUP: policy}
    )


def collect_artifacts(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry_id: str,
    action_id: str,
) -> dict[str, Any]:
    """Owned artifacts attached to a slot. Empty dict = nothing owned."""
    slot = store.get_slot(entry_id, action_id)
    if slot is None:
        return {}
    artifacts: dict[str, Any] = {}
    scene_id = slot.get("scene_id")
    if scene_id and store.get_owned_scene(scene_id) is not None:
        artifacts["scene"] = {
            "scene_id": scene_id,
            "entity_id": scene_entity_id(hass, scene_id),
        }
    # linked (owned=False) automations are not ours to delete; a shared
    # (per-remote) automation loses just this slot's branch — no question
    if (
        slot.get("materialized")
        and slot.get("automation_id")
        and slot.get("owned", True)
        and not slot.get("shared_automation")
    ):
        artifacts["automation"] = {"automation_id": slot["automation_id"]}
    return artifacts


async def async_cleanup_artifacts(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    artifacts: dict[str, Any],
    decision: str,
) -> None:
    """Apply a decision to collected artifacts.

    delete → scene and automation removed from their yaml stores.
    keep → ownership dropped (scene becomes hand-made); automation is
    disabled and the pointer is gone either way.
    """
    from .materializer import (
        _get_config_store,
        automation_entity_id,
    )

    if scene := artifacts.get("scene"):
        if decision == DECISION_DELETE:
            await get_scene_config_store(hass).async_delete(scene["scene_id"])
        store.async_drop_owned_scene(scene["scene_id"])

    if automation := artifacts.get("automation"):
        config_id = automation["automation_id"]
        if decision == DECISION_DELETE:
            await _get_config_store(hass).async_delete(config_id)
        elif entity_id := automation_entity_id(hass, config_id):
            await hass.services.async_call(
                "automation", "turn_off", {"entity_id": entity_id}, blocking=True
            )


async def async_cleanup_entry(
    hass: HomeAssistant,
    store: RemoteMapperStore,
    entry: ConfigEntry,
) -> None:
    """Bulk cleanup on config entry removal.

    always_delete removes every owned artifact; ask/never keep them
    (nothing is deleted silently — the interactive batch dialog needs a
    live card, which entry removal doesn't have).
    """
    policy = get_policy(entry)
    decision = DECISION_DELETE if policy == CLEANUP_ALWAYS_DELETE else DECISION_KEEP
    remote = store.get_remote(entry.entry_id) or {}
    for action_id in list(remote.get("slots", {})):
        artifacts = collect_artifacts(hass, store, entry.entry_id, action_id)
        if artifacts:
            await async_cleanup_artifacts(hass, store, artifacts, decision)
    for scene_id in store.owned_scenes_for(entry.entry_id):
        if decision == DECISION_DELETE:
            await get_scene_config_store(hass).async_delete(scene_id)
        store.async_drop_owned_scene(scene_id)
    if decision == DECISION_DELETE:
        from .materializer import _get_config_store
        from .remote_automation import remote_automation_config_id

        await _get_config_store(hass).async_delete(
            remote_automation_config_id(entry.entry_id)
        )

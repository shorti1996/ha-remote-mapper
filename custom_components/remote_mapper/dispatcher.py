# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Dispatch physical remote events to slot sequences.

One adapter subscription per remote; sequences run as ad-hoc Script
objects (no per-mapping automation/script entities). The dispatcher must
never raise — failures land in the slot's last_error.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import Context, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.script import Script, async_validate_actions_config

from .const import DOMAIN, EVENT_ACTION

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, HomeAssistant

    from .adapters.base import RemoteSourceAdapter
    from .store import RemoteMapperStore

_LOGGER = logging.getLogger(__name__)


class SlotDispatcher:
    """Routes a remote's events to its slot sequences."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry_id: str,
        name: str,
        store: RemoteMapperStore,
        adapter: RemoteSourceAdapter,
        source_config: dict[str, Any],
        action_ids: list[str],
    ) -> None:
        """Initialize."""
        self.hass = hass
        self.entry_id = entry_id
        self.name = name
        self.store = store
        self.adapter = adapter
        self.source_config = source_config
        self.action_ids = action_ids
        self._unsub: CALLBACK_TYPE | None = None

    async def async_attach(self) -> None:
        """Subscribe via the adapter."""
        self._unsub = await self.adapter.async_subscribe(
            self.hass,
            self.source_config,
            self.action_ids,
            self._handle_action,
            self.name,
        )

    async def async_update_actions(self, action_ids: list[str]) -> None:
        """Re-subscribe with a new action set (actions discovered at runtime)."""
        self.action_ids = action_ids
        self.async_detach()
        await self.async_attach()

    @callback
    def async_detach(self) -> None:
        """Unsubscribe (entry unload)."""
        if self._unsub is not None:
            self._unsub()
            self._unsub = None

    @callback
    def _handle_action(self, action_id: str, raw: dict[str, Any]) -> None:
        """Adapter callback — announce to cards, then schedule the dispatch."""
        self.hass.bus.async_fire(
            EVENT_ACTION, {"entry_id": self.entry_id, "action_id": action_id}
        )
        self.hass.async_create_task(
            self.async_dispatch(action_id),
            f"{DOMAIN} dispatch {self.name} {action_id}",
        )

    async def async_dispatch(self, action_id: str) -> None:
        """Physical press: run the slot's sequence, honoring the skip matrix."""
        slot = self.store.get_slot(self.entry_id, action_id)
        if slot is None:
            # Empty slot — no-op by design
            return
        if slot.get("archived") or slot.get("materialized"):
            # Archived = soft-disabled; materialized = the automation has
            # its own trigger for this press and is already running.
            return
        await self._async_run_sequence(action_id, slot.get("sequence") or [])

    async def async_run_from_card(self, action_id: str) -> None:
        """Dashboard tap: run whatever the slot is bound to.

        No physical event happened, so nothing else runs this press and the
        skip matrix does not apply. A slot's own sequence runs as usual; an
        automation-backed slot runs its automation:

        - a branch of a Shape A automation (the remote's shared one, or an
          imported one) runs the branch's actions ad hoc — HA's
          ``automation.trigger`` resets the ``trigger`` variable, so the
          ``choose`` could never pick the branch;
        - any other automation is triggered with ``skip_condition`` — its
          conditions may read ``trigger.*``, which a tap does not carry.
        """
        from .materializer import _get_config_store, automation_entity_id
        from .remote_automation import branch_view

        slot = self.store.get_slot(self.entry_id, action_id)
        if slot is None or slot.get("archived"):
            return
        if not slot.get("materialized"):
            await self._async_run_sequence(action_id, slot.get("sequence") or [])
            return

        config_id = slot.get("automation_id")
        raw = (
            await _get_config_store(self.hass).async_get(config_id)
            if config_id
            else None
        )
        if raw is None:
            self._record_failure(action_id, "The automation no longer exists")
            return
        if (branch := branch_view(raw, action_id)) is not None:
            if branch["branch_missing"]:
                self._record_failure(
                    action_id, "The automation has no branch for this event"
                )
                return
            await self._async_run_sequence(action_id, branch["actions"])
            return

        entity_id = automation_entity_id(self.hass, config_id)
        if entity_id is None:
            self._record_failure(action_id, "The automation has no entity")
            return
        try:
            await self.hass.services.async_call(
                "automation",
                "trigger",
                {"entity_id": entity_id, "skip_condition": True},
                blocking=True,
                context=Context(),
            )
        except Exception as err:
            self._record_failure(action_id, str(err), err)
            return
        self.store.async_record_run(self.entry_id, action_id, None)

    async def _async_run_sequence(self, action_id: str, sequence: list[Any]) -> None:
        """Run actions as an ad-hoc Script; failures land in last_error."""
        if not sequence:
            return
        try:
            validated = cv.SCRIPT_SCHEMA(sequence)
            validated = await async_validate_actions_config(self.hass, validated)
            script = Script(
                self.hass,
                validated,
                f"{self.name} {action_id}",
                DOMAIN,
            )
            # Real Context so logbook attribution works
            await script.async_run(context=Context())
        except Exception as err:
            self._record_failure(action_id, str(err), err)
            return
        self.store.async_record_run(self.entry_id, action_id, None)

    def _record_failure(
        self, action_id: str, message: str, err: Exception | None = None
    ) -> None:
        _LOGGER.warning(
            "Slot %s/%s failed: %s", self.name, action_id, message, exc_info=err
        )
        self.store.async_record_run(self.entry_id, action_id, message)

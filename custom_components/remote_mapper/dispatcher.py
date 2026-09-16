# SPDX-License-Identifier: AGPL-3.0-only
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
        """Run the slot's sequence, honoring the skip matrix."""
        slot = self.store.get_slot(self.entry_id, action_id)
        if slot is None:
            # Empty slot — no-op by design
            return
        if slot.get("archived") or slot.get("materialized"):
            # Archived = soft-disabled; materialized = the generated
            # automation handles the parallel trigger.
            return
        sequence = slot.get("sequence") or []
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
            _LOGGER.warning(
                "Slot %s/%s failed: %s", self.name, action_id, err, exc_info=True
            )
            self.store.async_record_run(self.entry_id, action_id, str(err))
            return
        self.store.async_record_run(self.entry_id, action_id, None)

# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Adapter contract — pluggable remote-source backends.

Each adapter owns both the runtime subscription and the static trigger
payload for materialization (symmetry: async_subscribe ↔ build_trigger).
Downstream code (dispatcher, materializer, card, store) never branches on
source type.

Deviation from the design doc contract: async_subscribe takes the explicit
action_ids list — the stored layout is canonical (users may keep actions
the source has not discovered yet), so the subscription set can't be
derived from source config alone.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Protocol

if TYPE_CHECKING:
    from collections.abc import Callable

    from homeassistant.core import CALLBACK_TYPE, HomeAssistant

# on_action(action_id, raw_trigger_data) — must be safe to call from the
# event loop; implementations schedule their own tasks.
type ActionCallback = Callable[[str, dict[str, Any]], None]


class RemoteSourceAdapter(Protocol):
    """Contract for a remote source backend."""

    id: str
    label: str

    async def async_subscribe(
        self,
        hass: HomeAssistant,
        config: dict[str, Any],
        action_ids: list[str],
        on_action: ActionCallback,
        name: str,
    ) -> CALLBACK_TYPE:
        """Subscribe to the remote's events; returns unsubscribe.

        Raises HomeAssistantError when nothing could be attached.
        """
        ...

    def build_trigger(self, action_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """Return a trigger dict for materialization (internal platform form)."""
        ...

    async def async_default_actions(
        self, hass: HomeAssistant, config: dict[str, Any]
    ) -> list[str]:
        """Best-effort enumeration of available action ids; [] is valid."""
        ...

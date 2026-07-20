"""Adapter registry — one entry per remote source type.

Adding a protocol (Matter/BTHome/…) is one new adapter file plus a
registry entry; nothing downstream branches on source type.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from .device_trigger import DeviceTriggerAdapter

if TYPE_CHECKING:
    from .base import RemoteSourceAdapter

ADAPTERS: dict[str, RemoteSourceAdapter] = {
    DeviceTriggerAdapter.id: DeviceTriggerAdapter(),
}


def get_adapter(source: str) -> RemoteSourceAdapter:
    """Return the adapter for a source id."""
    return ADAPTERS[source]

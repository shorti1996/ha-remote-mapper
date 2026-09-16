# SPDX-License-Identifier: AGPL-3.0-only
"""Adapter registry — one entry per remote source type.

Adding a protocol (Matter/BTHome/…) is one new adapter file plus a
registry entry; nothing downstream branches on source type.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from .device_trigger import DeviceTriggerAdapter
from .event_entity import EventEntityAdapter
from .matter import MatterRemoteAdapter
from .mqtt_generic import MqttGenericAdapter
from .z2m_mqtt import Z2mMqttAdapter

if TYPE_CHECKING:
    from .base import RemoteSourceAdapter

ADAPTERS: dict[str, RemoteSourceAdapter] = {
    DeviceTriggerAdapter.id: DeviceTriggerAdapter(),
    Z2mMqttAdapter.id: Z2mMqttAdapter(),
    EventEntityAdapter.id: EventEntityAdapter(),
    MatterRemoteAdapter.id: MatterRemoteAdapter(),
    MqttGenericAdapter.id: MqttGenericAdapter(),
}


def get_adapter(source: str) -> RemoteSourceAdapter:
    """Return the adapter for a source id."""
    return ADAPTERS[source]

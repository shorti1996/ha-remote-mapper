# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Fallback adapter: raw Zigbee2MQTT topic.

Subscribes to zigbee2mqtt/<name> and extracts the `action` field. Works
without HA discovery — the robust escape hatch while Z2M naming evolves.
Cannot enumerate actions (no discovery), so probes return [].
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components import mqtt
from homeassistant.core import callback

from ..const import ADAPTER_Z2M_MQTT, CONF_TOPIC

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, HomeAssistant

    from .base import ActionCallback

_LOGGER = logging.getLogger(__name__)


class Z2mMqttAdapter:
    """Adapter over a raw zigbee2mqtt/<device> topic."""

    id = ADAPTER_Z2M_MQTT
    label = "Zigbee2MQTT raw topic"

    async def async_default_actions(
        self, hass: HomeAssistant, config: dict[str, Any]
    ) -> list[str]:
        """No enumeration without discovery — empty list is valid."""
        return []

    def build_trigger(self, action_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """MQTT trigger matching the extracted action."""
        return {
            "platform": "mqtt",
            "topic": config[CONF_TOPIC],
            "value_template": "{{ value_json.action }}",
            "payload": action_id,
        }

    async def async_subscribe(
        self,
        hass: HomeAssistant,
        config: dict[str, Any],
        action_ids: list[str],
        on_action: ActionCallback,
        name: str,
    ) -> CALLBACK_TYPE:
        """Subscribe to the topic; every non-empty action is forwarded."""

        @callback
        def _message(msg: mqtt.ReceiveMessage) -> None:
            try:
                payload = json.loads(msg.payload)
            except ValueError, TypeError:
                return
            action = payload.get("action") if isinstance(payload, dict) else None
            # Z2M publishes an empty action to clear the previous one
            if action:
                on_action(str(action), {"topic": msg.topic, "payload": payload})

        return await mqtt.async_subscribe(hass, config[CONF_TOPIC], _message)

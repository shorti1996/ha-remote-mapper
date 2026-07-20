"""Fallback adapter: arbitrary MQTT topic + template.

Escape hatch for deCONZ, ESPHome, custom firmware — anything that
publishes button events over MQTT. The optional value_template extracts
the action id from the payload; without it the raw payload is the id.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components import mqtt
from homeassistant.core import callback
from homeassistant.helpers.template import Template

from ..const import ADAPTER_MQTT_GENERIC, CONF_TOPIC, CONF_VALUE_TEMPLATE

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, HomeAssistant

    from .base import ActionCallback

_LOGGER = logging.getLogger(__name__)


class MqttGenericAdapter:
    """Adapter over any MQTT topic."""

    id = ADAPTER_MQTT_GENERIC
    label = "Generic MQTT topic"

    async def async_default_actions(
        self, hass: HomeAssistant, config: dict[str, Any]
    ) -> list[str]:
        """Nothing to enumerate for arbitrary topics."""
        return []

    def build_trigger(self, action_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """MQTT trigger with the same extraction template."""
        trigger: dict[str, Any] = {
            "platform": "mqtt",
            "topic": config[CONF_TOPIC],
            "payload": action_id,
        }
        if template := config.get(CONF_VALUE_TEMPLATE):
            trigger["value_template"] = template
        return trigger

    async def async_subscribe(
        self,
        hass: HomeAssistant,
        config: dict[str, Any],
        action_ids: list[str],
        on_action: ActionCallback,
        name: str,
    ) -> CALLBACK_TYPE:
        """Subscribe; action id = rendered template or the raw payload."""
        template_str = config.get(CONF_VALUE_TEMPLATE)
        template = Template(template_str, hass) if template_str else None

        @callback
        def _message(msg: mqtt.ReceiveMessage) -> None:
            if template is not None:
                try:
                    action = template.async_render_with_possible_json_value(
                        msg.payload, ""
                    )
                except Exception:
                    _LOGGER.debug("Template failed for payload %r", msg.payload)
                    return
            else:
                action = msg.payload
            if action:
                on_action(str(action), {"topic": msg.topic, "payload": msg.payload})

        return await mqtt.async_subscribe(hass, config[CONF_TOPIC], _message)

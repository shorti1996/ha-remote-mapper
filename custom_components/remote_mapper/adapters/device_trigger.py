# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Primary adapter: HA device triggers (Z2M via MQTT, ZHA, any provider).

Subscribes to a device's published device triggers with the same coroutine
the automation component uses (async_initialize_triggers — third-party
precedent: HomeKit type_triggers). action_id := trigger subtype; the
trigger's `id` field carries it back to the callback.

Z2M discovery is lazy — a device trigger for an action is only published
after that action fires once. To avoid "press every combination first",
the probe also reads Zigbee2MQTT's retained ``<base>/bridge/devices`` and
merges the device's full ``action`` enum (Z2M 2.x exposes it). Attaching
not-yet-discovered subtypes is safe (the MQTT placeholder trigger arms on
discovery).
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.components.device_automation import (
    DeviceAutomationType,
    async_get_device_automations,
)
from homeassistant.components.device_automation.exceptions import DeviceNotFound
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.trigger import (
    async_initialize_triggers,
    async_validate_trigger_config,
)

from ..const import ADAPTER_DEVICE_TRIGGER, CONF_DEVICE_ID, DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, Context, HomeAssistant

    from .base import ActionCallback

_LOGGER = logging.getLogger(__name__)

# Z2M stamps device identifiers as ("mqtt", "zigbee2mqtt_<ieee>") whatever
# the base topic is; the devices list itself lives under <base>/bridge/.
Z2M_IDENTIFIER_PREFIX = "zigbee2mqtt_"
Z2M_DEVICES_TOPIC = "+/bridge/devices"
# Retained message arrives right after subscribing; tests shrink this.
Z2M_EXPOSES_TIMEOUT = 2.0


def _z2m_ieee(hass: HomeAssistant, device_id: str) -> str | None:
    """IEEE address if the registry device was created by Zigbee2MQTT."""
    device = dr.async_get(hass).async_get(device_id)
    if device is None:
        return None
    for domain, ident in device.identifiers:
        if domain == "mqtt" and ident.startswith(Z2M_IDENTIFIER_PREFIX):
            return ident[len(Z2M_IDENTIFIER_PREFIX) :]
    return None


def _action_values(definition: dict[str, Any]) -> list[str]:
    """The ``action`` enum values from a Z2M device definition, if any."""
    for expose in definition.get("exposes", []):
        if expose.get("property") == "action" and isinstance(
            expose.get("values"), list
        ):
            return [str(v) for v in expose["values"]]
    return []


async def async_z2m_exposed_actions(hass: HomeAssistant, device_id: str) -> list[str]:
    """Full action list from Z2M's retained bridge/devices; [] if unavailable."""
    ieee = _z2m_ieee(hass, device_id)
    if ieee is None or "mqtt" not in hass.config.components:
        return []
    from homeassistant.components import mqtt

    result: asyncio.Future[list[str]] = hass.loop.create_future()

    @callback
    def _received(msg: Any) -> None:
        if result.done():
            return
        try:
            devices = json.loads(msg.payload)
        except ValueError:
            return
        for device in devices if isinstance(devices, list) else []:
            if device.get("ieee_address") == ieee:
                result.set_result(_action_values(device.get("definition") or {}))
                return

    try:
        unsub = await mqtt.async_subscribe(hass, Z2M_DEVICES_TOPIC, _received)
    except HomeAssistantError as err:
        _LOGGER.debug("Z2M devices list unavailable: %s", err)
        return []
    try:
        return await asyncio.wait_for(result, Z2M_EXPOSES_TIMEOUT)
    except TimeoutError:
        return []
    finally:
        unsub()


class DeviceTriggerAdapter:
    """Adapter over HA device triggers."""

    id = ADAPTER_DEVICE_TRIGGER
    label = "Device trigger (Zigbee2MQTT, ZHA, …)"

    def __init__(self) -> None:
        """Initialize."""
        # Last probe per device — build_trigger() is sync, probing is not.
        self._probe_cache: dict[str, list[dict[str, Any]]] = {}

    async def _async_probe(
        self, hass: HomeAssistant, device_id: str
    ) -> list[dict[str, Any]]:
        """Enumerate the device's triggers (internal platform: form)."""
        try:
            by_device = await async_get_device_automations(
                hass, DeviceAutomationType.TRIGGER, [device_id]
            )
        except DeviceNotFound:
            _LOGGER.warning("Device %s not found while probing triggers", device_id)
            return []
        triggers = list(by_device.get(device_id, []))
        self._probe_cache[device_id] = triggers
        return triggers

    async def async_default_actions(
        self, hass: HomeAssistant, config: dict[str, Any]
    ) -> list[str]:
        """Z2M's full action list (device order) + any probed subtypes."""
        device_id = config[CONF_DEVICE_ID]
        triggers = await self._async_probe(hass, device_id)
        seen: dict[str, None] = {}
        for action in await async_z2m_exposed_actions(hass, device_id):
            seen.setdefault(action, None)
        for trigger in triggers:
            if (subtype := trigger.get("subtype")) is not None:
                seen.setdefault(str(subtype), None)
        return list(seen)

    def build_trigger(self, action_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """Identity: the probed trigger dict whose subtype == action_id.

        Falls back to the Z2M MQTT shape when the subtype was never probed
        (lazy discovery) — safe to attach, arms on discovery.
        """
        device_id = config[CONF_DEVICE_ID]
        for trigger in self._probe_cache.get(device_id, []):
            if str(trigger.get("subtype")) == action_id:
                return dict(trigger)
        template = self._template_trigger(device_id)
        return {**template, "subtype": action_id}

    def _template_trigger(self, device_id: str) -> dict[str, Any]:
        """Base dict for not-yet-discovered subtypes.

        Only subtype-carrying triggers are usable templates — a device
        also exposes its entities' device triggers (sensor/button/…)
        which have no subtype; cloning one of those and injecting a
        subtype fails the provider schema ("extra keys not allowed").
        """
        for trigger in self._probe_cache.get(device_id, []):
            if trigger.get("subtype") is not None:
                return dict(trigger)
        # Nothing subtype-shaped probed — assume the Z2M MQTT convention.
        return {
            "platform": "device",
            "domain": "mqtt",
            "device_id": device_id,
            "type": "action",
        }

    async def async_subscribe(
        self,
        hass: HomeAssistant,
        config: dict[str, Any],
        action_ids: list[str],
        on_action: ActionCallback,
        name: str,
    ) -> CALLBACK_TYPE:
        """Attach one trigger per action id; returns unsubscribe."""
        device_id = config[CONF_DEVICE_ID]
        probed = await self._async_probe(hass, device_id)

        by_subtype: dict[str, list[dict[str, Any]]] = {}
        for trigger in probed:
            if (subtype := trigger.get("subtype")) is not None:
                by_subtype.setdefault(str(subtype), []).append(trigger)

        configs: list[dict[str, Any]] = []
        for action_id in action_ids:
            if matches := by_subtype.get(action_id):
                # A subtype can appear under several types (e.g. ZHA
                # short/long press) — attach all, same action id.
                configs.extend({**match, "id": action_id} for match in matches)
            else:
                _LOGGER.debug(
                    "Action %s not discovered yet on %s, attaching placeholder",
                    action_id,
                    device_id,
                )
                configs.append(
                    {
                        **self._template_trigger(device_id),
                        "subtype": action_id,
                        "id": action_id,
                    }
                )

        # Validate per-config: one bad trigger (renamed subtype, foreign
        # provider quirk) must not take down the whole remote.
        validated: list[dict[str, Any]] = []
        for config_item in configs:
            try:
                validated.extend(
                    await async_validate_trigger_config(hass, [config_item])
                )
            except vol.Invalid as err:
                _LOGGER.warning(
                    "Skipping trigger for %s/%s — %s (config: %s)",
                    device_id,
                    config_item.get("id"),
                    err,
                    config_item,
                )
        if not validated:
            raise HomeAssistantError(f"No valid trigger config for device {device_id}")

        async def _handle(
            run_variables: dict[str, Any], context: Context | None = None
        ) -> None:
            trigger = run_variables.get("trigger", {})
            if action_id := trigger.get("id"):
                on_action(str(action_id), dict(trigger))

        remove = await async_initialize_triggers(
            hass, validated, _handle, DOMAIN, name, _LOGGER.log
        )
        # None = every attach failed/skipped (errors surfaced via log_cb only)
        if remove is None:
            raise HomeAssistantError(
                f"No trigger could be attached for device {device_id}"
            )
        return remove

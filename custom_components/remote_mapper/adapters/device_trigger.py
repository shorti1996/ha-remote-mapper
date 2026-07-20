"""Primary adapter: HA device triggers (Z2M via MQTT, ZHA, any provider).

Subscribes to a device's published device triggers with the same coroutine
the automation component uses (async_initialize_triggers — third-party
precedent: HomeKit type_triggers). action_id := trigger subtype; the
trigger's `id` field carries it back to the callback.

Z2M discovery is lazy — a device trigger for an action is only published
after that action fires once. Probes may therefore return a partial
subtype set; attaching not-yet-discovered subtypes is safe (the MQTT
placeholder trigger arms on discovery).
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.components.device_automation import (
    DeviceAutomationType,
    async_get_device_automations,
)
from homeassistant.components.device_automation.exceptions import DeviceNotFound
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.trigger import (
    async_initialize_triggers,
    async_validate_trigger_config,
)

from ..const import ADAPTER_DEVICE_TRIGGER, CONF_DEVICE_ID, DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, Context, HomeAssistant

    from .base import ActionCallback

_LOGGER = logging.getLogger(__name__)


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
        """Return unique subtypes, probe order preserved."""
        triggers = await self._async_probe(hass, config[CONF_DEVICE_ID])
        seen: dict[str, None] = {}
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

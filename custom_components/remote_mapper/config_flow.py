"""Config flow for Remote Mapper: pick device → probe actions → confirm."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.selector import selector

from .adapters import get_adapter
from .const import (
    ADAPTER_DEVICE_TRIGGER,
    CONF_ACTIONS,
    CONF_DEVICE_ID,
    CONF_LAYOUT,
    CONF_SOURCE,
    CONF_SOURCE_CONFIG,
    DOMAIN,
)


class RemoteMapperConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for one remote."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialize."""
        self._device_id: str | None = None
        self._probed: list[str] = []

    async def _async_probe(self) -> None:
        """Enumerate the device's triggers via the adapter."""
        adapter = get_adapter(ADAPTER_DEVICE_TRIGGER)
        self._probed = await adapter.async_default_actions(
            self.hass, {CONF_DEVICE_ID: self._device_id}
        )

    def _derive_title(self) -> str:
        """Device registry name (user rename wins)."""
        device = dr.async_get(self.hass).async_get(self._device_id)
        if device:
            return device.name_by_user or device.name or "Remote"
        return "Remote"

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pick the source device."""
        if user_input is not None:
            self._device_id = user_input[CONF_DEVICE_ID]
            await self.async_set_unique_id(self._device_id)
            self._abort_if_unique_id_configured()
            await self._async_probe()
            return await self.async_step_actions()

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required(CONF_DEVICE_ID): selector({"device": {}})}
            ),
        )

    async def async_step_actions(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Confirm/edit the probed action list.

        Z2M discovery is lazy — actions appear only after each button has
        been pressed once. "Probe again" re-reads after pressing buttons;
        custom values cover never-pressed actions.
        """
        errors: dict[str, str] = {}

        if user_input is not None:
            if user_input.get("reprobe"):
                await self._async_probe()
            else:
                actions: list[str] = user_input.get(CONF_ACTIONS, [])
                if not actions:
                    errors["base"] = "no_actions"
                else:
                    return self.async_create_entry(
                        title=self._derive_title(),
                        data={
                            CONF_SOURCE: ADAPTER_DEVICE_TRIGGER,
                            CONF_SOURCE_CONFIG: {CONF_DEVICE_ID: self._device_id},
                            CONF_LAYOUT: {CONF_ACTIONS: actions},
                        },
                    )

        return self.async_show_form(
            step_id="actions",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_ACTIONS, default=self._probed): selector(
                        {
                            "select": {
                                "options": self._probed,
                                "multiple": True,
                                "custom_value": True,
                            }
                        }
                    ),
                    vol.Optional("reprobe", default=False): selector({"boolean": {}}),
                }
            ),
            errors=errors,
            description_placeholders={
                "found": str(len(self._probed)),
                "device": self._derive_title(),
            },
        )

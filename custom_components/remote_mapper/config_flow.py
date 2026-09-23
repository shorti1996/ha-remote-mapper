# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Config flow for Remote Mapper: pick device → probe actions → confirm."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import selector

from .adapters import get_adapter
from .adapters.matter import button_tokens
from .const import (
    ADAPTER_DEVICE_TRIGGER,
    ADAPTER_EVENT_ENTITY,
    ADAPTER_MATTER,
    ADAPTER_MQTT_GENERIC,
    ADAPTER_Z2M_MQTT,
    CLEANUP_ALWAYS_DELETE,
    CLEANUP_ASK,
    CLEANUP_NEVER_DELETE,
    CONF_ACTIONS,
    CONF_BUTTONS,
    CONF_DEVICE_ID,
    CONF_ENTITY_ID,
    CONF_LAYOUT,
    CONF_OWNED_SCENE_CLEANUP,
    CONF_SNAPSHOT_ENTITIES,
    CONF_SOURCE,
    CONF_SOURCE_CONFIG,
    CONF_TOPIC,
    CONF_VALUE_TEMPLATE,
    DOMAIN,
)


class RemoteMapperOptionsFlow(OptionsFlow):
    """Per-remote options: snapshot default entity set + cleanup policy."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show/save the options form."""
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        options = self.config_entry.options
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        CONF_SNAPSHOT_ENTITIES,
                        default=list(options.get(CONF_SNAPSHOT_ENTITIES, [])),
                    ): selector({"entity": {"multiple": True}}),
                    vol.Optional(
                        CONF_OWNED_SCENE_CLEANUP,
                        default=options.get(CONF_OWNED_SCENE_CLEANUP, CLEANUP_ASK),
                    ): selector(
                        {
                            "select": {
                                "options": [
                                    CLEANUP_ASK,
                                    CLEANUP_ALWAYS_DELETE,
                                    CLEANUP_NEVER_DELETE,
                                ],
                                "mode": "dropdown",
                            }
                        }
                    ),
                }
            ),
        )


class RemoteMapperConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for one remote."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> RemoteMapperOptionsFlow:
        """Return the options flow handler."""
        return RemoteMapperOptionsFlow()

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
        """Pick the source type (device triggers are the primary path)."""
        return self.async_show_menu(
            step_id="user",
            menu_options=[
                "device",
                "matter",
                "z2m_topic",
                "event_entity",
                "mqtt_generic",
            ],
        )

    async def async_step_device(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pick the source device."""
        if user_input is not None:
            self._device_id = user_input[CONF_DEVICE_ID]
            # A flow left open (page reloaded mid-setup) must not block a
            # retry; HA aborts the stale one when this one creates the entry.
            await self.async_set_unique_id(self._device_id, raise_on_progress=False)
            self._abort_if_unique_id_configured()
            await self._async_probe()
            return await self.async_step_actions()

        return self.async_show_form(
            step_id="device",
            data_schema=vol.Schema(
                {vol.Required(CONF_DEVICE_ID): selector({"device": {}})}
            ),
        )

    async def async_step_matter(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pick a device; group every one of its event.* entities into one card.

        Matter remotes expose one event entity per physical button — this
        collects them all so a single card carries every button and event.
        """
        errors: dict[str, str] = {}
        if user_input is not None:
            device_id = user_input[CONF_DEVICE_ID]
            entity_ids = sorted(
                entry.entity_id
                for entry in er.async_entries_for_device(
                    er.async_get(self.hass), device_id, include_disabled_entities=False
                )
                if entry.domain == "event"
            )
            if not entity_ids:
                errors["base"] = "no_event_entities"
            else:
                await self.async_set_unique_id(
                    f"matter:{device_id}", raise_on_progress=False
                )
                self._abort_if_unique_id_configured()
                buttons = {
                    token: entity_id
                    for entity_id, token in button_tokens(entity_ids).items()
                }
                source_config = {
                    CONF_DEVICE_ID: device_id,
                    CONF_BUTTONS: buttons,
                }
                actions = await get_adapter(ADAPTER_MATTER).async_default_actions(
                    self.hass, source_config
                )
                if not actions:
                    errors["base"] = "no_actions"
                else:
                    device = dr.async_get(self.hass).async_get(device_id)
                    title = (
                        (device.name_by_user or device.name) if device else None
                    ) or "Remote"
                    return self.async_create_entry(
                        title=title,
                        data={
                            CONF_SOURCE: ADAPTER_MATTER,
                            CONF_SOURCE_CONFIG: source_config,
                            CONF_LAYOUT: {CONF_ACTIONS: actions},
                        },
                    )

        return self.async_show_form(
            step_id="matter",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_DEVICE_ID): selector(
                        {"device": {"entity": {"domain": "event"}}}
                    )
                }
            ),
            errors=errors,
        )

    async def _create_manual(
        self,
        source: str,
        source_config: dict[str, Any],
        title: str,
        unique_id: str,
        actions: list[str],
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(unique_id, raise_on_progress=False)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(
            title=title,
            data={
                CONF_SOURCE: source,
                CONF_SOURCE_CONFIG: source_config,
                CONF_LAYOUT: {CONF_ACTIONS: actions},
            },
        )

    async def async_step_z2m_topic(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Raw zigbee2mqtt/<name> topic + hand-typed action ids."""
        errors: dict[str, str] = {}
        if user_input is not None:
            actions = user_input.get(CONF_ACTIONS, [])
            if not actions:
                errors["base"] = "no_actions"
            else:
                topic = user_input[CONF_TOPIC].strip().rstrip("/")
                return await self._create_manual(
                    ADAPTER_Z2M_MQTT,
                    {CONF_TOPIC: topic},
                    topic.split("/")[-1] or topic,
                    f"z2m:{topic}",
                    actions,
                )
        return self.async_show_form(
            step_id="z2m_topic",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_TOPIC): str,
                    vol.Required(CONF_ACTIONS): selector(
                        {
                            "select": {
                                "options": [],
                                "multiple": True,
                                "custom_value": True,
                            }
                        }
                    ),
                }
            ),
            errors=errors,
        )

    async def async_step_event_entity(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """event.*_action entity; actions prefilled from event_types."""
        errors: dict[str, str] = {}
        if user_input is not None:
            entity_id = user_input[CONF_ENTITY_ID]
            adapter = get_adapter(ADAPTER_EVENT_ENTITY)
            probed = await adapter.async_default_actions(
                self.hass, {CONF_ENTITY_ID: entity_id}
            )
            actions = user_input.get(CONF_ACTIONS) or probed
            if not actions:
                errors["base"] = "no_actions"
            else:
                state = self.hass.states.get(entity_id)
                title = (
                    state.attributes.get("friendly_name", entity_id)
                    if state
                    else entity_id
                )
                return await self._create_manual(
                    ADAPTER_EVENT_ENTITY,
                    {CONF_ENTITY_ID: entity_id},
                    str(title),
                    f"event:{entity_id}",
                    [str(a) for a in actions],
                )
        return self.async_show_form(
            step_id="event_entity",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_ENTITY_ID): selector(
                        {"entity": {"domain": "event"}}
                    ),
                    vol.Optional(CONF_ACTIONS): selector(
                        {
                            "select": {
                                "options": [],
                                "multiple": True,
                                "custom_value": True,
                            }
                        }
                    ),
                }
            ),
            errors=errors,
        )

    async def async_step_mqtt_generic(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Arbitrary topic + optional value_template."""
        errors: dict[str, str] = {}
        if user_input is not None:
            actions = user_input.get(CONF_ACTIONS, [])
            if not actions:
                errors["base"] = "no_actions"
            else:
                topic = user_input[CONF_TOPIC].strip()
                source_config: dict[str, Any] = {CONF_TOPIC: topic}
                if template := user_input.get(CONF_VALUE_TEMPLATE):
                    source_config[CONF_VALUE_TEMPLATE] = template
                return await self._create_manual(
                    ADAPTER_MQTT_GENERIC,
                    source_config,
                    topic,
                    f"mqtt:{topic}",
                    actions,
                )
        return self.async_show_form(
            step_id="mqtt_generic",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_TOPIC): str,
                    vol.Optional(CONF_VALUE_TEMPLATE): str,
                    vol.Required(CONF_ACTIONS): selector(
                        {
                            "select": {
                                "options": [],
                                "multiple": True,
                                "custom_value": True,
                            }
                        }
                    ),
                }
            ),
            errors=errors,
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

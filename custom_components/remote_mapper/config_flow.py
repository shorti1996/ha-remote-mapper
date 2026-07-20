"""Config flow for Remote Mapper."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_NAME
from homeassistant.util import slugify

from .const import DOMAIN


class RemoteMapperConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for one remote.

    M0 skeleton: name-only entry. M1 replaces this with the device picker +
    press-each-button probe.
    """

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        if user_input is not None:
            name = user_input[CONF_NAME].strip()
            await self.async_set_unique_id(slugify(name))
            self._abort_if_unique_id_configured()
            return self.async_create_entry(title=name, data={})

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required(CONF_NAME): str}),
        )

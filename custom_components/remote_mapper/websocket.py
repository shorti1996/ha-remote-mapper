"""WebSocket API for the Remote Mapper card."""

from __future__ import annotations

from typing import TYPE_CHECKING

import voluptuous as vol
from homeassistant.components import websocket_api

from .const import DOMAIN, INTEGRATION_VERSION

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/ping"})
@websocket_api.async_response
async def ws_ping(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Hello-world handshake: card verifies the backend is present."""
    connection.send_result(msg["id"], {"version": INTEGRATION_VERSION})


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all remote_mapper/* commands (called once from async_setup)."""
    websocket_api.async_register_command(hass, ws_ping)

# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Names the integration shows in the card or writes into HA.

A remote is called what its device is called: the name given in the
config flow's last step or later on the device page. The config entry
keeps the name the remote had when it was added, so it is the fallback.

Managed automations read ``<remote> · <event> [remote_mapper]``. The tag
goes last so HA's automation list reads and sorts by the remote's name;
automations from before 0.1.5 lead with it, and every check below
accepts either position.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.helpers import device_registry as dr

from .buttons import split_action
from .const import AUTOMATION_ALIAS_TAG, DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant


def remote_name(hass: HomeAssistant, entry: ConfigEntry) -> str:
    """The remote's device name as the user set it, else the entry title."""
    device = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, entry.entry_id)})
    if device is not None and device.name_by_user:
        return device.name_by_user
    return entry.title


def event_label(remote: dict[str, Any], action_id: str, name: str | None) -> str:
    """One event in an alias: the given name, else button label + event, else id."""
    if name:
        return name
    buttons = (remote.get("grid_layout") or {}).get("buttons") or {}
    button_id, event = split_action(remote.get("source"), action_id)
    if label := (buttons.get(button_id) or {}).get("label"):
        return f"{label} {event}"
    return action_id


def managed_alias(remote: str, event: str | None = None) -> str:
    """Alias of an automation we manage; no event = the per-remote one."""
    base = f"{remote} · {event}" if event else remote
    return f"{base} {AUTOMATION_ALIAS_TAG}"


def is_managed_alias(alias: Any) -> bool:
    """Carries our tag, in either position."""
    return AUTOMATION_ALIAS_TAG in str(alias or "")


def plain_alias(alias: str) -> str:
    """The alias without our tag (hand-back)."""
    return " ".join(str(alias).replace(AUTOMATION_ALIAS_TAG, "").split())

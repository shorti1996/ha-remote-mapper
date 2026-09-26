# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""A remote with six events, driven over the card's websocket API, and a
count of what each press or card tap set off.

Effects are counted from HA itself: a ``test.automation`` call counts as
its ``via``, a script run as ``script:<id>``, a scene activation as
``scene:<id>`` and a flip of an ``input_boolean.tog_*`` as ``toggle:<id>``.
A press that runs something twice shows it twice.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
import yaml
from homeassistant.const import EVENT_CALL_SERVICE, EVENT_STATE_CHANGED
from homeassistant.core import Event, callback
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_mqtt_message,
    async_mock_service,
)

from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.remote_automation import (
    remote_automation_config_id,
)

from .conftest import REMOTE_IDENTIFIER, REMOTE_TOPIC, fire_remote_action

EVENTS = ["1_single", "1_double", "1_hold", "2_single", "2_double", "2_hold"]
# random walks: seeds and steps per file; `make test-deep` runs 100 and 80
WALK_SEEDS = int(os.environ.get("STRESS_SEEDS", "3"))
WALK_STEPS = int(os.environ.get("STRESS_STEPS", "50"))
# entities a slot can act on; lamps are what snapshot scenes capture
TOGGLES = ["tog_a", "tog_b"]
LAMPS = ["lamp_1", "lamp_2"]
SCRIPTS = ["s1", "s2"]
# hand-made scenes in scenes.yaml
SCENES = {"movie": {"lamp_1": "off", "lamp_2": "on"}, "relax": {"lamp_1": "on"}}


def seq(via: str) -> list[dict[str, Any]]:
    return [{"action": "test.automation", "data": {"via": via}}]


def call(action: str, entity_id: str) -> list[dict[str, Any]]:
    return [{"action": action, "target": {"entity_id": entity_id}}]


def toggle(obj: str) -> list[dict[str, Any]]:
    """The card's toggle quick mode."""
    return call("homeassistant.toggle", f"input_boolean.{obj}")


def script(obj: str) -> list[dict[str, Any]]:
    """The card's script quick mode."""
    return call("script.turn_on", f"script.{obj}")


def scene(obj: str) -> list[dict[str, Any]]:
    """The card's scene quick mode."""
    return call("scene.turn_on", f"scene.{obj}")


@pytest.fixture
def yaml_env(hass, remote_device):
    """Serve live automations.yaml and scenes.yaml to the reload services."""
    automations = Path(hass.config.path("automations.yaml"))
    scenes = Path(hass.config.path("scenes.yaml"))
    automations.write_text("[]\n")
    scenes.write_text(
        yaml.safe_dump(
            [
                {
                    "id": f"hand_{name}",
                    "name": name.capitalize(),
                    "entities": {f"input_boolean.{e}": s for e, s in states.items()},
                }
                for name, states in SCENES.items()
            ]
        )
    )

    def _config(*_args, **_kwargs):
        return {
            "automation": load_yaml(str(automations)) or [],
            "scene": load_yaml(str(scenes)) or [],
        }

    with patch("homeassistant.config.load_yaml_config_file", side_effect=_config):
        yield
    automations.unlink(missing_ok=True)
    scenes.unlink(missing_ok=True)


def device_trigger(device_id: str, subtype: str, trigger_id: str | None = None):
    trigger = {
        "trigger": "device",
        "domain": "mqtt",
        "device_id": device_id,
        "type": "action",
        "subtype": subtype,
    }
    if trigger_id:
        trigger["id"] = trigger_id
    return trigger


class Rig:
    """One remote with six events, driven over the card's websocket API."""

    def __init__(self, hass, client, entry, device_id: str) -> None:
        self.hass = hass
        self.client = client
        self.entry = entry
        self.device_id = device_id
        self.log: list[str] = []
        self.effects: list[str] = []
        async_mock_service(hass, "test", "automation")
        hass.bus.async_listen(EVENT_CALL_SERVICE, self._on_call)
        hass.bus.async_listen("script_started", self._on_script)
        hass.bus.async_listen(EVENT_STATE_CHANGED, self._on_state)

    @callback
    def _on_call(self, event: Event) -> None:
        if event.data["domain"] == "test":
            self.effects.append(event.data["service_data"]["via"])

    @callback
    def _on_script(self, event: Event) -> None:
        self.effects.append(f"script:{event.data['entity_id'].split('.', 1)[1]}")

    @callback
    def _on_state(self, event: Event) -> None:
        old, new = event.data["old_state"], event.data["new_state"]
        if old is None or new is None or old.state == new.state:
            return  # added, removed or reloaded; not a run
        domain, obj = event.data["entity_id"].split(".", 1)
        if domain == "scene":
            self.effects.append(f"scene:{obj}")
        elif domain == "input_boolean" and obj.startswith("tog_"):
            self.effects.append(f"toggle:{obj}")

    @property
    def entry_id(self) -> str:
        return self.entry.entry_id

    @property
    def store(self):
        return self.hass.data[DOMAIN]["store"]

    async def ws(self, msg: dict, ok: bool = True) -> dict:
        await self.client.send_json_auto_id(msg)
        res = await self.client.receive_json()
        await self.hass.async_block_till_done()
        if ok:
            assert res["success"], (msg, res, self.log)
        return res

    def _msg(self, kind: str, event: str, **extra) -> dict:
        return {
            "type": f"{DOMAIN}/{kind}",
            "entry_id": self.entry_id,
            "action_id": event,
            **extra,
        }

    # ── operations the card offers ──

    async def save(
        self,
        event: str,
        content: str | list | None = None,
        decision: str = "delete",
        **extra,
    ) -> dict:
        """Save a slot; ``content`` is a via for seq() or a whole sequence.

        A save that stops running the slot's snapshot scene is asked about
        first, as in the card: ``decision`` answers and the save goes again.
        """
        self.log.append(f"save {event} {content} {extra}")
        if content is not None:
            extra["sequence"] = seq(content) if isinstance(content, str) else content
        res = await self.ws(self._msg("save_slot", event, **extra))
        if res["result"].get("needs_decision"):
            self.log.append(f"  -> {decision} the replaced scene")
            extra["decision"] = decision
            res = await self.ws(self._msg("save_slot", event, **extra))
        return res

    async def remote_automation(self, event: str, ok: bool = True) -> dict:
        """ "Automation for the whole remote" / "Add this button to it"."""
        self.log.append(f"remote_automation {event}")
        return await self.ws(self._msg("create_automation", event, scope="remote"), ok)

    async def button_automation(self, event: str) -> dict:
        self.log.append(f"button_automation {event}")
        return await self.ws(self._msg("create_automation", event, scope="button"))

    async def move(self, source: str, target: str, ok: bool = True) -> dict:
        self.log.append(f"move {source} -> {target}")
        return await self.ws(
            self._msg("move_slot", source, target_action_id=target), ok
        )

    async def clear(self, event: str, decision: str = "delete") -> dict:
        self.log.append(f"clear {event} ({decision})")
        return await self.ws(self._msg("clear_slot", event, decision=decision))

    async def untick(self, event: str) -> dict:
        self.log.append(f"untick {event}")
        return await self.ws(self._msg("save_slot", event, materialized=False))

    async def link(self, event: str, entity_id: str) -> dict:
        self.log.append(f"link {event} {entity_id}")
        return await self.ws(self._msg("save_slot", event, link_entity_id=entity_id))

    async def archive(self, event: str, archived: bool, ok: bool = True) -> dict:
        self.log.append(f"archive {event} {archived}")
        return await self.ws(self._msg("archive_slot", event, archived=archived), ok)

    async def snapshot(
        self, event: str, re_snapshot: bool = False, ok: bool = True
    ) -> dict:
        """ "Scene from current state" (lamps) / "Re-snapshot"."""
        self.log.append(f"snapshot {event} re={re_snapshot}")
        extra: dict[str, Any] = {"re_snapshot": re_snapshot}
        if not re_snapshot:
            extra["entities"] = [f"input_boolean.{e}" for e in LAMPS]
        return await self.ws(self._msg("create_snapshot", event, **extra), ok)

    async def set_lamps(self, *states: str) -> None:
        for obj, state in zip(LAMPS, states, strict=True):
            await self.hass.services.async_call(
                "input_boolean",
                f"turn_{state}",
                {"entity_id": f"input_boolean.{obj}"},
                blocking=True,
            )

    def lamps(self) -> tuple[str, ...]:
        return tuple(self.hass.states.get(f"input_boolean.{e}").state for e in LAMPS)

    # ── what runs ──

    async def press(self, event: str) -> list[str]:
        start = len(self.effects)
        fire_remote_action(self.hass, event)
        await self.hass.async_block_till_done()
        return sorted(self.effects[start:])

    async def tap(self, event: str) -> list[str]:
        start = len(self.effects)
        res = await self.ws(self._msg("run_slot", event))
        assert res["result"]["last_error"] is None, (event, res, self.log)
        return sorted(self.effects[start:])

    async def check(
        self,
        press: dict[str, list[str]],
        tap: dict[str, list[str]] | None = None,
    ) -> None:
        """Press and tap every event; unlisted events must run nothing."""
        want_press = {e: sorted(press.get(e, [])) for e in EVENTS}
        want_tap = {**want_press, **{e: sorted(v) for e, v in (tap or {}).items()}}
        got_press = {e: await self.press(e) for e in EVENTS}
        got_tap = {e: await self.tap(e) for e in EVENTS}
        for what, got, want in (
            ("press", got_press, want_press),
            ("tap", got_tap, want_tap),
        ):
            diff = {e: (got[e], want[e]) for e in EVENTS if got[e] != want[e]}
            assert not diff, f"{what} (got, want): {diff}\n" + "\n".join(self.log)

    # ── what is stored ──

    def automations(self) -> dict[str, dict]:
        items = load_yaml(self.hass.config.path("automations.yaml")) or []
        return {a["id"]: a for a in items}

    def scenes(self) -> dict[str, dict]:
        items = load_yaml(self.hass.config.path("scenes.yaml")) or []
        return {s["id"]: s for s in items}

    def shared(self) -> dict | None:
        return self.automations().get(remote_automation_config_id(self.entry_id))

    def slot(self, event: str) -> dict | None:
        return self.store.get_slot(self.entry_id, event)


async def make_rig(
    hass, hass_ws_client, device_id: str, natives: list[dict] = ()
) -> Rig:
    """Discover the four extra events, set up the helpers, native
    automations and hand-made scenes, then the remote."""
    for action in EVENTS[2:]:
        async_fire_mqtt_message(
            hass,
            f"homeassistant/device_automation/test_remote/action_{action}/config",
            json.dumps(
                {
                    "automation_type": "trigger",
                    "topic": REMOTE_TOPIC,
                    "payload": action,
                    "type": "action",
                    "subtype": action,
                    "device": {"identifiers": [REMOTE_IDENTIFIER[1]]},
                }
            ),
        )
    await hass.async_block_till_done()
    if natives:
        Path(hass.config.path("automations.yaml")).write_text(
            yaml.safe_dump(list(natives))
        )
    assert await async_setup_component(
        hass, "input_boolean", {"input_boolean": {e: {} for e in TOGGLES + LAMPS}}
    )
    assert await async_setup_component(
        hass,
        "script",
        {"script": {s: {"sequence": [{"event": f"ran_{s}"}]} for s in SCRIPTS}},
    )
    assert await async_setup_component(hass, "automation", {})
    assert await async_setup_component(hass, "scene", {"scene": []})
    await hass.async_block_till_done()  # scene.reload comes with a platform task
    await hass.services.async_call("automation", "reload", blocking=True)
    await hass.services.async_call("scene", "reload", blocking=True)
    await hass.async_block_till_done()
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test Remote",
        unique_id=device_id,
        data={
            "source": "device_trigger",
            "source_config": {"device_id": device_id},
            "layout": {"actions": list(EVENTS)},
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return Rig(hass, await hass_ws_client(hass), entry, device_id)

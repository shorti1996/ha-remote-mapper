# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Grouping overrides mixed into the two-remote walk (plan ai/09).

Grouping only changes how the card draws buttons; it must never change
what a press or tap runs. Every third step of the walk from
``test_stress_remotes`` is a grouping op — put an event on a button with
a press kind, send one back to its derived place, or reset them all —
and the walk's own ``check()`` keeps proving that every press and tap on
both remotes still runs what the slot models say. On top of that, the
store, ``get_remote`` and ``get_options`` must agree with a model of the
overrides after every step.
"""

from __future__ import annotations

import random

import pytest

from custom_components.remote_mapper.buttons import (
    KIND_OTHER,
    group_buttons,
    grouping_conflict,
    place_action,
)
from custom_components.remote_mapper.const import DOMAIN

from .stress_rig import (  # noqa: F401 - yaml_env is a fixture
    EVENTS,
    WALK_SEEDS,
    WALK_STEPS,
    Rig,
    yaml_env,
)
from .test_stress_remotes import Walk, _pair

pytestmark = pytest.mark.usefixtures("yaml_env")

KINDS = ["single", "double", "triple", "hold", "release", KIND_OTHER]
# the derived buttons of the six events, plus names no derived button has
BUTTONS = ["1", "2", "top", "bottom"]


class GroupingWalk(Walk):
    """The slot walk with grouping ops and a model of the overrides."""

    def __init__(self, a: Rig, b: Rig, rnd: random.Random) -> None:
        super().__init__(a, b, rnd)
        self.grouping: dict[Rig, dict[str, dict[str, str]]] = {a: {}, b: {}}

    def _source(self, rig: Rig) -> str:
        return rig.store.get_remote(rig.entry_id)["source"]

    async def step(self) -> None:
        if self.rnd.random() >= 1 / 3:
            await super().step()
            return
        rnd = self.rnd
        rig = rnd.choice(list(self.rigs))
        model = self.grouping[rig]
        op = rnd.choice(["group", "group", "group", "ungroup", "reset"])
        if op == "ungroup" and model:
            # back to the derived place — refused when another override
            # sits there now (2_hold moved to button 1 blocks 1_hold's way back)
            event = rnd.choice(sorted(model))
            candidate = {k: v for k, v in model.items() if k != event}
            conflict = grouping_conflict(
                group_buttons(self._source(rig), EVENTS, candidate), event
            )
            rig.log.append(f"ungroup {event} ({'refused' if conflict else 'ok'})")
            res = await rig.ws(rig._msg("group_action", event), ok=False)
            assert res["success"] == (conflict is None), (res, conflict, self.log())
            if conflict:
                assert res["error"]["message"] == conflict, res
                return
            del model[event]
            return
        if op == "reset" and model:
            rig.log.append("reset grouping")
            await rig.ws({"type": f"{DOMAIN}/reset_grouping", "entry_id": rig.entry_id})
            model.clear()
            return
        # group: the server accepts exactly when the result has no named
        # kind twice on a button — decided here with the same functions
        event = rnd.choice(EVENTS)
        override: dict[str, str] = {"button": rnd.choice(BUTTONS)}
        if rnd.random() < 0.8:
            override["kind"] = rnd.choice(KINDS)
        candidate = {**model, event: override}
        buttons = group_buttons(self._source(rig), EVENTS, candidate)
        conflict = grouping_conflict(buttons, event)
        rig.log.append(
            f"group {event} -> {override} ({'refused' if conflict else 'ok'})"
        )
        res = await rig.ws({**rig._msg("group_action", event), **override}, ok=False)
        assert res["success"] == (conflict is None), (res, conflict, self.log())
        if conflict:
            assert res["error"]["code"] == "invalid_format", res
            assert res["error"]["message"] == conflict, res
            return
        model[event] = override
        assert res["result"]["grouping"] == model, self.log()
        assert res["result"]["buttons"] == buttons, self.log()

    async def assert_grouping(self) -> None:
        """Store, get_remote and get_options agree with the model."""
        for rig, model in self.grouping.items():
            where = (rig.entry.title, self.log())
            assert rig.store.get_remote(rig.entry_id).get("grouping", {}) == model, (
                where
            )
            res = await rig.ws(
                {"type": f"{DOMAIN}/get_remote", "entry_id": rig.entry_id}
            )
            remote = res["result"]
            assert remote["grouping"] == model, where
            buttons = remote["buttons"]
            # every event on exactly one button, where the model puts it
            placed = {
                a["action_id"]: (b["id"], a["event"], a["kind"])
                for b in buttons
                for a in b["actions"]
            }
            assert sorted(placed) == sorted(EVENTS), where
            assert sum(len(b["actions"]) for b in buttons) == len(EVENTS), where
            source = self._source(rig)
            for event in EVENTS:
                assert placed[event] == place_action(source, model, event), (
                    event,
                    where,
                )
            # no named kind twice on a button; no empty button
            assert grouping_conflict(buttons) is None, where
            assert all(b["actions"] for b in buttons), where
            res = await rig.ws(
                {"type": f"{DOMAIN}/get_options", "entry_id": rig.entry_id}
            )
            assert res["result"]["grouping_count"] == len(model), where


@pytest.mark.parametrize("seed", range(WALK_SEEDS))
async def test_random_walk_with_grouping(
    hass, hass_ws_client, remote_device, seed: int
) -> None:
    """Grouping ops between the card operations; after each step both
    remotes still run what the slot models say, and the overrides are
    stored and shown as the grouping model says."""
    a, b = await _pair(hass, hass_ws_client, remote_device)
    walk = GroupingWalk(a, b, random.Random(seed))
    for _ in range(WALK_STEPS):
        await walk.step()
        walk.assert_stored()
        await walk.assert_grouping()
        await walk.check()

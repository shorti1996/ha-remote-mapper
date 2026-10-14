# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Two remotes, actions moving between them (plan ai/08).

Remote A is the device-trigger remote with native automations on two of
its events; remote B is a raw-MQTT one with the same six event names.
The random walk mixes every card operation with moves across the two,
and after each step presses and taps all twelve events against a model
of what each should run.
"""

from __future__ import annotations

import random

import pytest

from custom_components.remote_mapper.remote_automation import (
    remote_automation_config_id,
)

from .stress_rig import (  # noqa: F401 - yaml_env is a fixture
    EVENTS,
    SCENES,
    WALK_SEEDS,
    WALK_STEPS,
    Rig,
    device_trigger,
    make_rig,
    make_rig_b,
    seq,
    yaml_env,
)

pytestmark = pytest.mark.usefixtures("yaml_env")

# remote A's events with a native automation of their own, and what it runs
NATIVES = {"1_single": "N1", "2_double": "N2"}


def _native(device_id: str, event: str) -> dict:
    return {
        "id": f"native_{event}",
        "alias": f"Native {event}",
        "triggers": [device_trigger(device_id, event)],
        "actions": seq(NATIVES[event]),
    }


# a tap runs what the card binds; natives fire on the press only
NO_NATIVES = {e: [] for e in NATIVES}


def _obj(entity_id: str) -> str:
    return entity_id.split(".", 1)[1]


async def _pair(hass, hass_ws_client, remote_device) -> tuple[Rig, Rig]:
    natives = [_native(remote_device, e) for e in NATIVES]
    a = await make_rig(hass, hass_ws_client, remote_device, natives)
    return a, await make_rig_b(a)


# ── directed scenarios ───────────────────────────────────────────────


async def test_scene_across_then_new_one_at_home(
    hass, hass_ws_client, remote_device
) -> None:
    """A snapshot moves to B and is re-snapshot there; a new snapshot at the
    event it came from gets a scene of its own."""
    a, b = await _pair(hass, hass_ws_client, remote_device)
    await a.set_lamps("on", "off")
    first = (await a.snapshot("1_single"))["result"]
    await a.move("1_single", "2_single", to=b)
    await a.set_lamps("off", "on")
    await b.snapshot("2_single", re_snapshot=True)
    captured = b.scenes()[first["scene_id"]]["entities"]
    assert captured["input_boolean.lamp_1"]["state"] == "off"
    await a.set_lamps("on", "on")
    second = (await a.snapshot("1_single"))["result"]
    assert second["scene_id"] != first["scene_id"]
    assert set(a.scenes()) >= {first["scene_id"], second["scene_id"]}
    mine = f"scene:{_obj(second['scene_entity_id'])}"
    await a.check(
        {"1_single": ["N1", mine], "2_double": ["N2"]},
        tap={"1_single": [mine], "2_double": []},
    )
    await b.check({"2_single": [f"scene:{_obj(first['scene_entity_id'])}"]})


async def test_branch_across_lands_in_card_then_joins(
    hass, hass_ws_client, remote_device
) -> None:
    """B has no remote automation: the branch runs from the card on B, and
    "add to the remote automation" there makes it a branch again."""
    a, b = await _pair(hass, hass_ws_client, remote_device)
    await a.save("1_hold", "x")
    await a.remote_automation("1_hold")
    await a.move("1_hold", "1_hold", to=b)
    assert b.slot("1_hold")["materialized"] is False
    assert b.shared() is None
    assert "1_hold" not in [t["id"] for t in a.shared()["triggers"]]
    await a.check({"1_single": ["N1"], "2_double": ["N2"]}, tap=NO_NATIVES)
    await b.check({"1_hold": ["x"]})

    await b.remote_automation("1_hold")
    assert b.slot("1_hold")["shared_automation"] is True
    await b.check({"1_hold": ["x"]})


async def test_absorbed_copy_across_then_release_a(
    hass, hass_ws_client, remote_device
) -> None:
    """The copy runs on B; handing A back turns the native on for A."""
    a, b = await _pair(hass, hass_ws_client, remote_device)
    await a.link("1_single", "automation.native_1_single")
    await a.untick("1_single")
    assert hass.states.get("automation.native_1_single").state == "off"
    await a.move("1_single", "1_double", to=b)
    await a.check({"2_double": ["N2"]}, tap=NO_NATIVES)
    await b.check({"1_double": ["N1"]})
    assert hass.states.get("automation.native_1_single").state == "off"

    await a.ws({"type": "remote_mapper/release_remote", "entry_id": a.entry_id})
    assert hass.states.get("automation.native_1_single").state == "on"
    await b.check({"1_double": ["N1"]})


async def test_linked_flat_across_and_back(hass, hass_ws_client, remote_device) -> None:
    """A linked one-trigger automation follows to B and back to A."""
    a, b = await _pair(hass, hass_ws_client, remote_device)
    await a.link("2_double", "automation.native_2_double")
    await a.move("2_double", "2_hold", to=b)
    await a.check({"1_single": ["N1"]}, tap=NO_NATIVES)
    await b.check({"2_hold": ["N2"]})
    assert b.slot("2_hold")["owned"] is False
    await b.move("2_hold", "2_double", to=a)
    await a.check(
        {"1_single": ["N1"], "2_double": ["N2"]},
        tap={"1_single": [], "2_double": ["N2"]},  # a tap runs a linked native
    )
    await b.check({})


# ── random walk ──────────────────────────────────────────────────────


class Model:
    """What each event of one remote should run.

    ``kind``: empty, plain, owned, shared or linked. ``via``: the effect
    of the slot's own actions. ``origin``: the native event whose actions
    an unlinked slot absorbed. ``scene``: the owned snapshot the slot
    points at. ``kept``: own automations kept on clear (off, the user's).
    """

    def __init__(self, natives: dict[str, str]) -> None:
        self.natives = natives
        self.kind = dict.fromkeys(EVENTS, "empty")
        self.via: dict[str, str | None] = dict.fromkeys(EVENTS)
        self.archived = dict.fromkeys(EVENTS, False)
        self.origin: dict[str, str | None] = dict.fromkeys(EVENTS)
        self.scene: dict[str, str | None] = dict.fromkeys(EVENTS)
        self.native_on = dict.fromkeys(natives, True)
        self.disabled_by_us: set[str] = set()
        self.kept: set[str] = set()

    FIELDS = ("kind", "via", "archived", "origin", "scene")

    def of(self, *kinds: str, archived: bool | None = None) -> list[str]:
        return [
            e
            for e in EVENTS
            if self.kind[e] in kinds
            and (archived is None or self.archived[e] == archived)
        ]

    def swap(self, a: str, b: str) -> None:
        for name in self.FIELDS:
            field = getattr(self, name)
            field[a], field[b] = field[b], field[a]

    def reset(self, event: str) -> None:
        for name in self.FIELDS:
            getattr(self, name)[event] = False if name == "archived" else None
        self.kind[event] = "empty"

    def take(self, event: str) -> dict:
        return {name: getattr(self, name)[event] for name in self.FIELDS}

    def put(self, event: str, record: dict) -> None:
        for name, value in record.items():
            getattr(self, name)[event] = value

    def _own(self, event: str) -> list[str]:
        if self.archived[event] or self.kind[event] not in ("plain", "owned", "shared"):
            return []
        return [self.via[event]] if self.via[event] else []

    def press(self) -> dict[str, list[str]]:
        return {
            e: self._own(e) + ([self.natives[e]] if self.native_on.get(e) else [])
            for e in EVENTS
        }

    def tap(self) -> dict[str, list[str]]:
        return {
            e: [self.natives[e]]
            if self.kind[e] == "linked" and not self.archived[e]
            else self._own(e)
            for e in EVENTS
        }


class Walk:
    """Two rigs, two models, one random walk."""

    def __init__(self, a: Rig, b: Rig, rnd: random.Random) -> None:
        self.rigs = {a: Model(NATIVES), b: Model({})}
        self.rnd = rnd
        self._n = 0

    def fresh(self) -> str:
        self._n += 1
        return f"v{self._n}"

    def other(self, rig: Rig) -> Rig:
        return next(r for r in self.rigs if r is not rig)

    async def across(self, src: Rig, source: str, dst: Rig, target: str) -> None:
        """Move or swap across; the model follows the table in ai/08."""
        ms, md = self.rigs[src], self.rigs[dst]
        moving = [(ms, source, md, target)]
        if md.kind[target] != "empty":
            moving.append((md, target, ms, source))
        records = [
            (m_from, e_from, m_to, e_to, m_from.take(e_from))
            for m_from, e_from, m_to, e_to in moving
        ]
        # a destination has a shared automation when a slot that stays
        # there is a branch of it (the moving ones are detached first)
        leaving = {(id(m), e) for m, e, _, _ in moving}
        has_shared = {
            id(m): any(
                m.kind[e] == "shared" and (id(m), e) not in leaving for e in EVENTS
            )
            for m in (ms, md)
        }
        await src.move(source, target, to=dst)
        for m_from, e_from, _, _, _ in records:
            m_from.reset(e_from)
        for m_from, _e_from, m_to, e_to, record in records:
            if record["kind"] == "shared" and not has_shared[id(m_to)]:
                record["kind"] = "plain"
            if record["origin"] is not None:
                m_from.disabled_by_us.add(record["origin"])
                record["origin"] = None
            m_to.put(e_to, record)

    async def step(self) -> None:
        rnd = self.rnd
        rig = rnd.choice(list(self.rigs))
        model = self.rigs[rig]
        ops = ["edit", "edit", "move", "across", "across", "clear", "remote", "own"]
        ops += ["shell", "untick", "archive", "link", "snapshot", "resnap"]
        while True:
            op = rnd.choice(ops)
            if op == "edit" and (
                events := model.of("empty", "plain", "owned", "shared")
            ):
                event = rnd.choice(events)
                via = self.fresh()
                await rig.save(event, via, rnd.choice(["delete", "keep"]))
                if model.kind[event] == "empty":
                    model.kind[event] = "plain"
                model.via[event], model.scene[event] = via, None
                return
            if op == "move" and (sources := model.of("plain", "owned", "shared")):
                source = rnd.choice(sources)
                target = rnd.choice(
                    [e for e in EVENTS if e != source and model.kind[e] != "linked"]
                )
                await rig.move(source, target)
                model.swap(source, target)
                return
            if op == "across" and (sources := model.of("plain", "owned", "shared")):
                other = self.other(rig)
                targets = self.rigs[other].of("empty", "plain", "owned", "shared")
                source = rnd.choice(sources)
                await self.across(rig, source, other, rnd.choice(targets))
                return
            if op == "clear" and (events := model.of("plain", "owned", "shared")):
                event = rnd.choice(events)
                decision = rnd.choice(["delete", "keep"])
                if decision == "keep" and model.kind[event] == "owned":
                    model.kept.add(rig.slot(event)["automation_id"])
                await rig.clear(event, decision)
                model.reset(event)
                return
            if op == "remote":
                if model.of("shared"):
                    events = model.of("empty", "plain", "owned", archived=False)
                    if not events:
                        continue
                    event = rnd.choice(events)
                    await rig.remote_automation(event)
                    model.kind[event] = "shared"
                    return
                joining = model.of("empty", "plain", archived=False)
                if not joining:
                    continue
                await rig.remote_automation(rnd.choice(EVENTS))
                for e in joining:
                    model.kind[e] = "shared"
                return
            if op == "own" and (events := model.of("empty", "plain")):
                event = rnd.choice(events)
                via = self.fresh()
                await rig.save(event, via, materialized=True)
                model.kind[event], model.via[event] = "owned", via
                model.scene[event] = None
                return
            if op == "shell" and (events := model.of("empty", "plain")):
                event = rnd.choice(events)
                await rig.button_automation(event)
                model.kind[event] = "owned"
                return
            if op == "untick" and (events := model.of("owned", "shared", "linked")):
                event = rnd.choice(events)
                await rig.untick(event)
                if model.kind[event] == "linked":  # absorbed; the native goes off
                    model.via[event] = model.natives[event]
                    model.origin[event] = event
                    model.native_on[event] = False
                    model.disabled_by_us.add(event)
                model.kind[event] = "plain"
                return
            if op == "archive" and (events := model.of("plain", "owned", "linked")):
                event = rnd.choice(events)
                archived = not model.archived[event]
                await rig.archive(event, archived)
                model.archived[event] = archived
                if model.kind[event] == "linked":
                    model.native_on[event] = not archived
                return
            if op == "link" and (
                events := [
                    e
                    for e in model.natives
                    if model.kind[e] in ("empty", "plain") and not model.archived[e]
                ]
            ):
                event = rnd.choice(events)
                await rig.link(event, f"automation.native_{event}")
                model.kind[event], model.via[event] = "linked", None
                model.scene[event] = None
                copy_elsewhere = any(
                    o != event and model.kind[o] == "plain" and model.origin[o] == event
                    for o in EVENTS
                )
                ours = event in model.disabled_by_us or any(
                    model.origin[o] == event for o in EVENTS
                )
                if not copy_elsewhere and ours:
                    model.native_on[event] = True
                    model.disabled_by_us.discard(event)
                return
            if op == "snapshot" and (
                events := model.of("empty", "plain", "owned", "shared")
            ):
                event = rnd.choice(events)
                await rig.set_lamps(
                    rnd.choice(["on", "off"]), rnd.choice(["on", "off"])
                )
                result = (await rig.snapshot(event))["result"]
                if model.kind[event] == "empty":
                    model.kind[event] = "plain"
                model.via[event] = f"scene:{_obj(result['scene_entity_id'])}"
                model.scene[event] = result["scene_id"]
                return
            if op == "resnap" and (events := [e for e in EVENTS if model.scene[e]]):
                event = rnd.choice(events)
                await rig.set_lamps(
                    rnd.choice(["on", "off"]), rnd.choice(["on", "off"])
                )
                await rig.snapshot(event, re_snapshot=True)
                return

    def log(self) -> str:
        return "\n" + "\n".join(
            f"{r.entry.title}: {line}" for r in self.rigs for line in r.log
        )

    def assert_stored(self) -> None:
        """automations.yaml, scenes.yaml and both stores agree with the models."""
        rigs = list(self.rigs)
        items = rigs[0].automations()
        want = {f"native_{e}" for e in NATIVES}
        for rig, model in self.rigs.items():
            want |= {
                rig.slot(e)["automation_id"] for e in model.of("owned")
            } | model.kept
            shared = model.of("shared")
            if shared:
                want.add(remote_automation_config_id(rig.entry_id))
                raw = items[remote_automation_config_id(rig.entry_id)]
                branches = [
                    b["conditions"][0]["id"] for b in raw["actions"][0]["choose"]
                ]
                assert sorted(branches) == sorted(shared), (rig.entry.title, self.log())
        assert set(items) == want, self.log()
        scenes = rigs[0].scenes()
        assert {f"hand_{s}" for s in SCENES} <= set(scenes), self.log()
        pointed = [m.scene[e] for m in self.rigs.values() for e in EVENTS if m.scene[e]]
        assert len(pointed) == len(set(pointed)), ("two slots, one scene", self.log())
        for rig, model in self.rigs.items():
            for e in EVENTS:
                slot = rig.slot(e)
                kind = model.kind[e]
                where = (rig.entry.title, e, self.log())
                if kind == "empty":
                    assert slot is None, where
                    continue
                assert slot is not None, where
                assert bool(slot.get("materialized")) == (kind != "plain"), where
                assert bool(slot.get("shared_automation")) == (kind == "shared"), where
                assert (slot.get("owned") is False) == (kind == "linked"), where
                assert bool(slot.get("archived")) == model.archived[e], where
                assert slot.get("scene_id") == model.scene[e], where
                assert bool(slot.get("imported_from")) == (
                    model.origin[e] is not None
                ), where
                if scene_id := model.scene[e]:
                    assert scene_id in scenes, where
                    owner = rig.store.get_owned_scene(scene_id)
                    assert owner["created_for"] == f"{rig.entry_id}/{e}", where
                if kind == "owned":
                    assert slot["automation_id"] in items, where
            for e, on in model.native_on.items():
                state = rig.hass.states.get(f"automation.native_{e}").state
                assert state == ("on" if on else "off"), (e, self.log())

    async def check(self) -> None:
        for rig, model in self.rigs.items():
            await rig.check(model.press(), tap=model.tap())


@pytest.mark.parametrize("seed", range(WALK_SEEDS))
async def test_random_walk(hass, hass_ws_client, remote_device, seed: int) -> None:
    """Card operations on two remotes in random order, moves across them
    included; after each, every press and tap on both runs what the
    models say, once."""
    a, b = await _pair(hass, hass_ws_client, remote_device)
    walk = Walk(a, b, random.Random(seed))
    for _ in range(WALK_STEPS):
        await walk.step()
        walk.assert_stored()
        await walk.check()

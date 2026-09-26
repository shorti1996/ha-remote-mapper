# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""What a press runs when slots hold scenes, scripts and toggles — the
card's quick modes and its snapshot scenes — on card-only slots, their own
automations and branches of the remote automation.

A toggle run twice leaves the entity where it was, so the checks count
every flip, scene activation and script run.
"""

from __future__ import annotations

import random

import pytest

from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.materializer import automation_config_id
from custom_components.remote_mapper.remote_automation import (
    remote_automation_config_id,
)

from .stress_rig import (  # noqa: F401 - yaml_env is a fixture
    EVENTS,
    SCENES,
    SCRIPTS,
    TOGGLES,
    WALK_SEEDS,
    WALK_STEPS,
    Rig,
    make_rig,
    scene,
    script,
    seq,
    toggle,
    yaml_env,
)

pytestmark = pytest.mark.usefixtures("yaml_env")


def _obj(entity_id: str) -> str:
    return entity_id.split(".", 1)[1]


# ── directed scenarios ───────────────────────────────────────────────


async def test_quick_modes_on_every_kind(hass, hass_ws_client, remote_device) -> None:
    """Toggle, script, hand-made scene and snapshot scene as card slots,
    own automations and branches, through the sweep, swaps and moves."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_single", toggle("tog_a"))
    await rig.save("1_double", script("s1"), materialized=True)
    await rig.save("1_hold", scene("movie"))
    await rig.set_lamps("on", "on")
    snap = _obj((await rig.snapshot("2_single"))["result"]["scene_entity_id"])
    want = {
        "1_single": ["toggle:tog_a"],
        "1_double": ["script:s1"],
        "1_hold": ["scene:movie"],
        "2_single": [f"scene:{snap}"],
    }
    await rig.check(want)

    await rig.remote_automation("1_single")  # the own automation stays out
    assert rig.slot("2_single")["shared_automation"] is True
    assert not rig.slot("1_double").get("shared_automation")
    await rig.check(want)

    await rig.move("1_single", "1_double")  # branch ↔ own automation
    want |= {"1_single": ["script:s1"], "1_double": ["toggle:tog_a"]}
    await rig.check(want)

    await rig.move("2_single", "2_hold")  # snapshot branch onto an empty one
    want |= {"2_single": [], "2_hold": [f"scene:{snap}"]}
    await rig.check(want)
    scene_id = rig.slot("2_hold")["scene_id"]
    owned = rig.store.get_owned_scene(scene_id)
    assert owned["created_for"] == f"{rig.entry_id}/2_hold"

    await rig.untick("1_hold")
    await rig.untick("2_hold")
    await rig.check(want)
    await rig.set_lamps("off", "off")
    await rig.press("2_hold")
    assert rig.lamps() == ("on", "on")


async def test_new_snapshot_where_a_moved_one_came_from(
    hass, hass_ws_client, remote_device
) -> None:
    """A snapshot scene keeps its id when its slot moves; a new snapshot at
    the event it left gets a scene of its own."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.set_lamps("on", "off")
    first = (await rig.snapshot("1_single"))["result"]
    await rig.move("1_single", "1_double")

    await rig.set_lamps("off", "on")
    second = (await rig.snapshot("1_single"))["result"]
    assert second["scene_id"] != first["scene_id"]
    await rig.check(
        {
            "1_single": [f"scene:{_obj(second['scene_entity_id'])}"],
            "1_double": [f"scene:{_obj(first['scene_entity_id'])}"],
        }
    )
    await rig.set_lamps("off", "off")
    await rig.press("1_double")
    assert rig.lamps() == ("on", "off")
    await rig.press("1_single")
    assert rig.lamps() == ("off", "on")

    await rig.clear("1_double")  # deletes its scene only
    assert first["scene_id"] not in rig.scenes()
    assert second["scene_id"] in rig.scenes()
    await rig.set_lamps("off", "off")
    await rig.press("1_single")
    assert rig.lamps() == ("off", "on")


async def test_kept_scene_survives_a_new_snapshot(
    hass, hass_ws_client, remote_device
) -> None:
    """ "Keep" on clear hands the scene over to the user; a new snapshot on
    the same event makes another scene instead of overwriting it."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.set_lamps("on", "off")
    kept = (await rig.snapshot("1_single"))["result"]
    await rig.clear("1_single", decision="keep")
    assert kept["scene_id"] in rig.scenes()
    await rig.save("1_double", scene(_obj(kept["scene_entity_id"])))

    await rig.set_lamps("off", "on")
    new = (await rig.snapshot("1_single"))["result"]
    assert new["scene_id"] != kept["scene_id"]
    await rig.set_lamps("off", "off")
    await rig.press("1_double")
    assert rig.lamps() == ("on", "off")


async def test_kept_automation_survives_a_new_one(
    hass, hass_ws_client, remote_device
) -> None:
    """ "Keep" on clear leaves the button's automation off and the user's; a
    new automation for the button is another one, and it runs."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_single", toggle("tog_a"), materialized=True)
    kept_id = rig.slot("1_single")["automation_id"]
    await rig.clear("1_single", decision="keep")
    assert kept_id in rig.automations()
    await rig.check({})

    await rig.save("1_single", script("s1"), materialized=True)
    assert rig.slot("1_single")["automation_id"] != kept_id
    assert rig.automations()[kept_id]["actions"] == toggle("tog_a")
    await rig.check({"1_single": ["script:s1"]})

    await rig.move("1_single", "1_double")  # and again on the way back
    await rig.save("1_single", toggle("tog_b"), materialized=True)
    await rig.check({"1_single": ["toggle:tog_b"], "1_double": ["script:s1"]})
    assert rig.automations()[kept_id]["actions"] == toggle("tog_a")


async def test_re_snapshot_keeps_the_actions_around_it(
    hass, hass_ws_client, remote_device
) -> None:
    """Re-snapshot gives the scene new states; the branch or automation
    that calls it keeps the steps added around the call."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_single", "a")
    await rig.remote_automation("1_single")  # every event a branch
    await rig.set_lamps("on", "on")
    branch_scene = (await rig.snapshot("1_single"))["result"]["scene_entity_id"]
    # YAML tab: a step after the scene call
    await rig.save("1_single", [*scene(_obj(branch_scene)), *seq("after")])

    await rig.clear("1_double")
    await rig.save("1_double", "own", materialized=True)
    own_scene = (await rig.snapshot("1_double"))["result"]["scene_entity_id"]
    # HA's automation editor: a step after the scene call
    own_id = automation_config_id(rig.entry_id, "1_double")
    raw = rig.automations()[own_id]
    await hass.data[DOMAIN]["automation_config_store"].async_upsert(
        own_id,
        {
            **{k: v for k, v in raw.items() if k != "id"},
            "actions": [*scene(_obj(own_scene)), *seq("edited")],
        },
    )
    want = {
        "1_single": [f"scene:{_obj(branch_scene)}", "after"],
        "1_double": [f"scene:{_obj(own_scene)}", "edited"],
    }
    await rig.check(want)

    await rig.set_lamps("off", "on")
    await rig.snapshot("1_single", re_snapshot=True)
    await rig.snapshot("1_double", re_snapshot=True)
    await rig.check(want)
    await rig.set_lamps("on", "off")
    await rig.press("1_single")
    assert rig.lamps() == ("off", "on")


async def test_save_that_drops_a_snapshot_asks_first(
    hass, hass_ws_client, remote_device
) -> None:
    """New actions that no longer run the slot's snapshot scene: the save
    asks what happens to the scene, and nothing changes until answered."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    snap = (await rig.snapshot("1_single"))["result"]
    token = f"scene:{_obj(snap['scene_entity_id'])}"

    res = await rig.ws(
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": rig.entry_id,
            "action_id": "1_single",
            "sequence": toggle("tog_a"),
        }
    )
    assert res["result"]["needs_decision"] is True
    assert res["result"]["artifacts"]["scene"]["entity_id"] == snap["scene_entity_id"]
    assert rig.slot("1_single")["scene_id"] == snap["scene_id"]
    await rig.check({"1_single": [token]})

    await rig.save("1_single", toggle("tog_a"), decision="delete")
    assert rig.slot("1_single")["scene_id"] is None
    assert snap["scene_id"] not in rig.scenes()
    await rig.check({"1_single": ["toggle:tog_a"]})


async def test_save_over_a_snapshot_keep_and_remember(
    hass, hass_ws_client, remote_device
) -> None:
    """ "Keep" leaves the scene in HA as the user's; "remember" answers the
    next save without asking, on a branch and an own automation too."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    kept = (await rig.snapshot("1_single"))["result"]
    await rig.ws(
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": rig.entry_id,
            "action_id": "1_single",
            "sequence": script("s1"),
            "decision": "keep",
            "remember": True,
        }
    )
    assert kept["scene_id"] in rig.scenes()
    assert rig.store.get_owned_scene(kept["scene_id"]) is None
    assert rig.slot("1_single")["scene_id"] is None

    await rig.save("1_double", "own", materialized=True)
    own = (await rig.snapshot("1_double"))["result"]
    await rig.save("1_hold", "b")
    await rig.remote_automation("1_hold")
    branch = (await rig.snapshot("1_hold"))["result"]
    for event in ("1_double", "1_hold"):
        res = await rig.ws(
            {
                "type": f"{DOMAIN}/save_slot",
                "entry_id": rig.entry_id,
                "action_id": event,
                "sequence": toggle("tog_b"),
            }
        )
        assert "needs_decision" not in res["result"], event
        assert rig.slot(event)["scene_id"] is None
    assert {own["scene_id"], branch["scene_id"]} <= set(rig.scenes())
    await rig.check(
        {
            "1_single": ["script:s1"],
            "1_double": ["toggle:tog_b"],
            "1_hold": ["toggle:tog_b"],
        }
    )


async def test_save_that_still_calls_the_snapshot_keeps_it(
    hass, hass_ws_client, remote_device
) -> None:
    """Steps added around the scene call: no question, the link stays and
    re-snapshot keeps the added steps."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.set_lamps("on", "on")
    snap = (await rig.snapshot("1_single"))["result"]
    token = f"scene:{_obj(snap['scene_entity_id'])}"
    res = await rig.ws(
        {
            "type": f"{DOMAIN}/save_slot",
            "entry_id": rig.entry_id,
            "action_id": "1_single",
            "sequence": [*scene(_obj(snap["scene_entity_id"])), *seq("after")],
        }
    )
    assert "needs_decision" not in res["result"]
    assert rig.slot("1_single")["scene_id"] == snap["scene_id"]

    await rig.set_lamps("off", "on")
    await rig.snapshot("1_single", re_snapshot=True)
    await rig.check({"1_single": [token, "after"]})
    await rig.set_lamps("off", "off")
    await rig.press("1_single")
    assert rig.lamps() == ("off", "on")


async def test_link_over_a_snapshot_asks_first(
    hass, hass_ws_client, remote_device
) -> None:
    """Linking a native automation replaces the slot's actions: the
    snapshot scene is asked about like any other replacement."""
    native = {
        "id": "native",
        "alias": "Native",
        "triggers": [
            {
                "trigger": "device",
                "domain": "mqtt",
                "device_id": remote_device,
                "type": "action",
                "subtype": "1_single",
            }
        ],
        "actions": toggle("tog_b"),
    }
    rig = await make_rig(hass, hass_ws_client, remote_device, [native])
    snap = (await rig.snapshot("1_single"))["result"]
    msg = {
        "type": f"{DOMAIN}/save_slot",
        "entry_id": rig.entry_id,
        "action_id": "1_single",
        "link_entity_id": "automation.native",
    }
    res = await rig.ws(msg)
    assert res["result"]["needs_decision"] is True
    assert not rig.slot("1_single")["materialized"]

    await rig.ws({**msg, "decision": "delete"})
    assert rig.slot("1_single")["automation_id"] == "native"
    assert snap["scene_id"] not in rig.scenes()
    await rig.check({"1_single": ["toggle:tog_b"]})


async def test_snapshot_on_linked_and_archived(
    hass, hass_ws_client, remote_device
) -> None:
    """Linked: refused. Archived card slot or own automation: stays silent."""
    native = {
        "id": "native",
        "alias": "Native",
        "triggers": [
            {
                "trigger": "device",
                "domain": "mqtt",
                "device_id": remote_device,
                "type": "action",
                "subtype": "1_single",
            }
        ],
        "actions": toggle("tog_b"),
    }
    rig = await make_rig(hass, hass_ws_client, remote_device, [native])
    await rig.link("1_single", "automation.native")
    res = await rig.snapshot("1_single", ok=False)
    assert "linked" in res["error"]["message"]

    await rig.save("1_double", toggle("tog_a"))
    await rig.archive("1_double", True)
    await rig.save("1_hold", script("s2"), materialized=True)
    await rig.archive("1_hold", True)
    await rig.snapshot("1_double")
    await rig.snapshot("1_hold")
    await rig.check({"1_single": ["toggle:tog_b"]})


# ── random walk ──────────────────────────────────────────────────────

CONTENT = (
    [(f"toggle:{t}", toggle(t)) for t in TOGGLES]
    + [(f"script:{s}", script(s)) for s in SCRIPTS]
    + [(f"scene:{s}", scene(s)) for s in SCENES]
)


class Model:
    """What each event should run. ``scene``: the owned snapshot scene the
    slot points at."""

    def __init__(self) -> None:
        self.kind = dict.fromkeys(EVENTS, "empty")
        self.token: dict[str, str | None] = dict.fromkeys(EVENTS)
        self.archived = dict.fromkeys(EVENTS, False)
        self.scene: dict[str, str | None] = dict.fromkeys(EVENTS)
        # own automations kept on clear: off, and the user's now
        self.kept: set[str] = set()
        self._n = 0

    def content(self, rnd: random.Random) -> tuple[str, list]:
        if rnd.random() < 0.3:
            self._n += 1
            return f"v{self._n}", seq(f"v{self._n}")
        return rnd.choice(CONTENT)

    def of(self, *kinds: str, archived: bool | None = None) -> list[str]:
        return [
            e
            for e in EVENTS
            if self.kind[e] in kinds
            and (archived is None or self.archived[e] == archived)
        ]

    def swap(self, a: str, b: str) -> None:
        for field in (self.kind, self.token, self.archived, self.scene):
            field[a], field[b] = field[b], field[a]

    def expected(self) -> dict[str, list[str]]:
        return {
            e: [self.token[e]]
            for e in EVENTS
            if self.kind[e] != "empty" and self.token[e] and not self.archived[e]
        }


async def _step(rig: Rig, model: Model, rnd: random.Random) -> None:
    ops = ["edit", "edit", "move", "move", "clear", "remote", "own", "untick"]
    ops += ["archive", "snapshot", "snapshot", "resnap"]
    while True:
        op = rnd.choice(ops)
        if op == "edit":
            event = rnd.choice(EVENTS)
            token, sequence = model.content(rnd)
            # the new content never calls a snapshot scene: the one the
            # slot had is deleted or kept as the user's, and unlinked
            await rig.save(event, sequence, rnd.choice(["delete", "keep"]))
            if model.kind[event] == "empty":
                model.kind[event] = "plain"
            model.scene[event] = None
            model.token[event] = token
            return
        if op == "move" and (sources := model.of("plain", "owned", "shared")):
            source = rnd.choice(sources)
            target = rnd.choice([e for e in EVENTS if e != source])
            await rig.move(source, target)
            model.swap(source, target)
            return
        if op == "clear" and (events := model.of("plain", "owned", "shared")):
            event = rnd.choice(events)
            decision = rnd.choice(["delete", "keep"])
            if decision == "keep" and model.kind[event] == "owned":
                model.kept.add(rig.slot(event)["automation_id"])
            await rig.clear(event, decision)
            model.kind[event], model.token[event] = "empty", None
            model.archived[event], model.scene[event] = False, None
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
            token, sequence = model.content(rnd)
            await rig.save(event, sequence, materialized=True)
            model.kind[event], model.token[event] = "owned", token
            model.scene[event] = None
            return
        if op == "untick" and (events := model.of("owned", "shared")):
            event = rnd.choice(events)
            await rig.untick(event)
            model.kind[event] = "plain"
            return
        if op == "archive" and (events := model.of("plain", "owned")):
            event = rnd.choice(events)
            model.archived[event] = not model.archived[event]
            await rig.archive(event, model.archived[event])
            return
        if op == "snapshot" and (
            events := model.of("empty", "plain", "owned", "shared")
        ):
            event = rnd.choice(events)
            await rig.set_lamps(rnd.choice(["on", "off"]), rnd.choice(["on", "off"]))
            result = (await rig.snapshot(event))["result"]
            if model.kind[event] == "empty":
                model.kind[event] = "plain"
            model.token[event] = f"scene:{_obj(result['scene_entity_id'])}"
            model.scene[event] = result["scene_id"]
            return
        if op == "resnap" and (events := [e for e in EVENTS if model.scene[e]]):
            event = rnd.choice(events)
            await rig.set_lamps(rnd.choice(["on", "off"]), rnd.choice(["on", "off"]))
            await rig.snapshot(event, re_snapshot=True)
            return


def _log(rig: Rig) -> str:
    return "\n" + "\n".join(rig.log)


def _assert_stored(rig: Rig, model: Model) -> None:
    """automations.yaml, scenes.yaml and the slots agree with the model."""
    items = rig.automations()
    want = {rig.slot(e)["automation_id"] for e in model.of("owned")} | model.kept
    shared = model.of("shared")
    if shared:
        want.add(remote_automation_config_id(rig.entry_id))
    assert set(items) == want, _log(rig)
    if shared:
        raw = items[remote_automation_config_id(rig.entry_id)]
        branches = [b["conditions"][0]["id"] for b in raw["actions"][0]["choose"]]
        assert sorted(branches) == sorted(shared), _log(rig)
    scenes = rig.scenes()
    assert {f"hand_{s}" for s in SCENES} <= set(scenes), _log(rig)
    pointed = [model.scene[e] for e in EVENTS if model.scene[e]]
    assert len(pointed) == len(set(pointed)), ("two slots, one scene", _log(rig))
    for e in EVENTS:
        slot = rig.slot(e)
        if model.kind[e] == "empty":
            assert slot is None, (e, _log(rig))
            continue
        assert slot["scene_id"] == model.scene[e], (e, _log(rig))
        assert bool(slot.get("archived")) == model.archived[e], (e, _log(rig))
        if scene_id := model.scene[e]:
            assert scene_id in scenes, (e, _log(rig))
            owner = rig.store.get_owned_scene(scene_id)
            assert owner["created_for"] == f"{rig.entry_id}/{e}", (e, _log(rig))


@pytest.mark.parametrize("seed", range(WALK_SEEDS))
async def test_random_walk(hass, hass_ws_client, remote_device, seed: int) -> None:
    """Content and snapshot operations in random order; after each, every
    press and tap runs what the model says, once."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    model = Model()
    rnd = random.Random(seed)
    for _ in range(WALK_STEPS):
        await _step(rig, model, rnd)
        _assert_stored(rig, model)
        await rig.check(model.expected())

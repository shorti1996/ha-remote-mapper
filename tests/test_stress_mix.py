# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""What a press runs after mixed edits — the remote automation, per-button
automations, linked native ones and card-only slots on one remote.

Every check presses each event and taps it on the card, and compares the
actions that ran, counted, with what the card shows for that event. The
random walk drives the operations the card offers in any order.
"""

from __future__ import annotations

import random

import pytest

from custom_components.remote_mapper.const import DOMAIN
from custom_components.remote_mapper.materializer import (
    automation_config_id,
    automation_entity_id,
)
from custom_components.remote_mapper.remote_automation import (
    remote_automation_config_id,
)

from .stress_rig import (  # noqa: F401 - yaml_env is a fixture
    EVENTS,
    WALK_SEEDS,
    WALK_STEPS,
    Rig,
    device_trigger,
    make_rig,
    seq,
    yaml_env,
)

pytestmark = pytest.mark.usefixtures("yaml_env")


# ── directed scenarios ───────────────────────────────────────────────


async def test_remote_automation_with_card_slots(
    hass, hass_ws_client, remote_device
) -> None:
    """Branches and card-only slots through swaps, moves, edits, clears, re-adds."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_single", "a")
    await rig.save("1_double", "b")
    await rig.save("2_single", "c")
    await rig.remote_automation("1_single")
    assert all(rig.slot(e)["shared_automation"] for e in EVENTS)
    await rig.check({"1_single": ["a"], "1_double": ["b"], "2_single": ["c"]})

    await rig.move("1_single", "1_double")  # branch ↔ branch
    await rig.check({"1_single": ["b"], "1_double": ["a"], "2_single": ["c"]})

    await rig.save("1_hold", "d")  # YAML tab on an empty branch
    await rig.move("1_hold", "2_hold")  # onto an empty branch: swap
    await rig.check(
        {"1_single": ["b"], "1_double": ["a"], "2_single": ["c"], "2_hold": ["d"]}
    )

    await rig.clear("2_single")  # branch + trigger go
    await rig.check({"1_single": ["b"], "1_double": ["a"], "2_hold": ["d"]})
    assert "2_single" not in [t["id"] for t in rig.shared()["triggers"]]

    await rig.move("2_hold", "2_single")  # onto a cleared event: re-keyed
    await rig.check({"1_single": ["b"], "1_double": ["a"], "2_single": ["d"]})

    await rig.clear("2_hold")
    await rig.remote_automation("2_hold")  # add it back, then fill it
    await rig.save("2_hold", "e")
    await rig.check(
        {"1_single": ["b"], "1_double": ["a"], "2_single": ["d"], "2_hold": ["e"]}
    )

    await rig.untick("1_single")  # branch → card, runs once
    assert rig.slot("1_single")["materialized"] is False
    await rig.check(
        {"1_single": ["b"], "1_double": ["a"], "2_single": ["d"], "2_hold": ["e"]}
    )

    await rig.move("1_double", "1_single")  # branch ↔ card slot
    assert rig.slot("1_single")["shared_automation"] is True
    assert rig.slot("1_double")["materialized"] is False
    await rig.check(
        {"1_single": ["a"], "1_double": ["b"], "2_single": ["d"], "2_hold": ["e"]}
    )

    await rig.save("1_double", "f")  # card slot edit
    await rig.save("1_single", "g")  # branch edit
    await rig.check(
        {"1_single": ["g"], "1_double": ["f"], "2_single": ["d"], "2_hold": ["e"]}
    )


async def test_own_linked_native_and_remote_side_by_side(
    hass, hass_ws_client, remote_device
) -> None:
    """Every kind of slot on one remote, plus a native automation the card
    doesn't know about on an event that also has a branch."""
    natives = [
        {
            "id": "native_linked",
            "alias": "Native linked",
            "triggers": [device_trigger(remote_device, "2_single")],
            "actions": seq("native"),
        },
        {
            "id": "native_extra",
            "alias": "Native extra",
            "triggers": [device_trigger(remote_device, "1_single")],
            "actions": seq("extra"),
        },
    ]
    rig = await make_rig(hass, hass_ws_client, remote_device, natives)
    await rig.link("2_single", "automation.native_linked")
    await rig.save("1_hold", "own", materialized=True)
    await rig.save("1_single", "a")
    await rig.save("1_double", "b")
    await rig.remote_automation("1_single")
    # the whole-remote sweep leaves the linked and the owned events alone
    assert rig.slot("2_single")["owned"] is False
    assert not rig.slot("1_hold").get("shared_automation")
    await rig.clear("2_double")  # swept in empty; make it a card slot
    await rig.save("2_double", "card")
    # the card doesn't show the extra automation, so a tap doesn't run it
    base = {"1_single": ["a"], "1_double": ["b"], "1_hold": ["own"]}
    base |= {"2_single": ["native"], "2_double": ["card"]}
    await rig.check({**base, "1_single": ["a", "extra"]}, tap={"1_single": ["a"]})

    res = await rig.move("2_single", "2_hold", ok=False)
    assert "linked" in res["error"]["message"]
    res = await rig.move("1_single", "2_single", ok=False)
    assert "linked" in res["error"]["message"]

    await rig.move("1_hold", "1_double")  # own automation ↔ branch
    assert not rig.slot("1_double").get("shared_automation")
    assert rig.slot("1_double")["automation_id"] == automation_config_id(
        rig.entry_id, "1_double"
    )
    assert rig.slot("1_hold")["shared_automation"] is True
    base |= {"1_double": ["own"], "1_hold": ["b"]}
    await rig.check({**base, "1_single": ["a", "extra"]}, tap={"1_single": ["a"]})
    owned_ids = {automation_config_id(rig.entry_id, e) for e in EVENTS}
    assert set(rig.automations()) & owned_ids == {
        automation_config_id(rig.entry_id, "1_double")
    }

    await rig.move("2_double", "1_double")  # card slot ↔ own automation
    base |= {"1_double": ["card"], "2_double": ["own"]}
    await rig.check({**base, "1_single": ["a", "extra"]}, tap={"1_single": ["a"]})
    assert set(rig.automations()) & owned_ids == {
        automation_config_id(rig.entry_id, "2_double")
    }

    await rig.archive("2_double", True)
    await rig.save("2_double", "own2")  # edit while archived: stays off
    base |= {"2_double": []}
    await rig.check({**base, "1_single": ["a", "extra"]}, tap={"1_single": ["a"]})
    await rig.archive("2_double", False)
    base |= {"2_double": ["own2"]}
    await rig.check({**base, "1_single": ["a", "extra"]}, tap={"1_single": ["a"]})

    res = await rig.archive("1_single", True, ok=False)  # a branch
    assert "branch" in res["error"]["message"]

    await rig.untick("2_single")  # absorb: copied in, native switched off
    assert hass.states.get("automation.native_linked").state == "off"
    await rig.check({**base, "1_single": ["a", "extra"]}, tap={"1_single": ["a"]})

    await rig.clear("2_double")  # own automation deleted
    base |= {"2_double": []}
    await rig.check({**base, "1_single": ["a", "extra"]}, tap={"1_single": ["a"]})
    assert set(rig.automations()) & owned_ids == set()


async def test_add_own_automation_event_to_remote_automation(
    hass, hass_ws_client, remote_device
) -> None:
    """ "Add this button to the remote automation" on a button with its own
    automation moves the live actions into the branch and deletes the
    automation; a press runs them once."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_single", "a")
    await rig.save("1_hold", "own", materialized=True)
    await rig.remote_automation("1_single")  # the sweep skips 1_hold
    assert not rig.slot("1_hold").get("shared_automation")
    await rig.check({"1_single": ["a"], "1_hold": ["own"]})

    # edited in HA since: the live actions are what moves into the branch
    own_id = automation_config_id(rig.entry_id, "1_hold")
    raw = rig.automations()[own_id]
    await hass.data[DOMAIN]["automation_config_store"].async_upsert(
        own_id, {**{k: v for k, v in raw.items() if k != "id"}, "actions": seq("ha")}
    )
    await rig.check({"1_single": ["a"], "1_hold": ["ha"]})

    await rig.remote_automation("1_hold")
    assert rig.slot("1_hold")["shared_automation"] is True
    await rig.check({"1_single": ["a"], "1_hold": ["ha"]})
    assert own_id not in rig.automations()


async def test_archived_card_slot_swept_into_remote_automation(
    hass, hass_ws_client, remote_device
) -> None:
    """An archived card slot stays silent when the whole-remote automation
    is created around it."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_single", "a")
    await rig.save("1_hold", "off")
    await rig.archive("1_hold", True)
    await rig.check({"1_single": ["a"]})

    await rig.remote_automation("1_single")
    await rig.check({"1_single": ["a"]})


async def test_recreated_automations_start_on(
    hass, hass_ws_client, remote_device
) -> None:
    """An automation made again under an id whose last one was off starts on.

    HA restores a removed entity's last state for the next entity with its
    id, and ours are derived from the event.
    """
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_hold", "a", materialized=True)
    await rig.archive("1_hold", True)
    await rig.untick("1_hold")  # the switched-off automation is deleted
    await rig.archive("1_hold", False)
    await rig.check({"1_hold": ["a"]})
    await rig.save("1_hold", "b", materialized=True)
    await rig.check({"1_hold": ["b"]})

    await rig.remote_automation("1_single")
    entity_id = automation_entity_id(hass, remote_automation_config_id(rig.entry_id))
    await hass.services.async_call(
        "automation", "turn_off", {"entity_id": entity_id}, blocking=True
    )
    for event in EVENTS:  # the last branch takes the automation with it
        if rig.slot(event) and rig.slot(event).get("shared_automation"):
            await rig.clear(event)
    assert rig.shared() is None
    await rig.save("2_single", "c")
    await rig.remote_automation("2_single")
    await rig.check({"1_hold": ["b"], "2_single": ["c"]})


async def test_add_linked_event_to_remote_automation(
    hass, hass_ws_client, remote_device
) -> None:
    """ "Add this button to the remote automation" on a linked button is
    refused: the native automation keeps firing on its own trigger, and the
    card would claim the button runs only the branch."""
    natives = [
        {
            "id": "native_linked",
            "alias": "Native linked",
            "triggers": [device_trigger(remote_device, "1_hold")],
            "actions": seq("native"),
        }
    ]
    rig = await make_rig(hass, hass_ws_client, remote_device, natives)
    await rig.save("1_single", "a")
    await rig.link("1_hold", "automation.native_linked")
    await rig.remote_automation("1_single")
    await rig.check({"1_single": ["a"], "1_hold": ["native"]})

    res = await rig.remote_automation("1_hold", ok=False)
    assert "untick the link" in res["error"]["message"]
    assert rig.slot("1_hold")["automation_id"] == "native_linked"
    await rig.check({"1_single": ["a"], "1_hold": ["native"]})


async def test_add_archived_event_to_remote_automation(
    hass, hass_ws_client, remote_device
) -> None:
    """ "Add this button" on a disabled card slot is refused."""
    rig = await make_rig(hass, hass_ws_client, remote_device)
    await rig.save("1_single", "a")
    await rig.remote_automation("1_single")
    await rig.clear("1_hold")
    await rig.save("1_hold", "off")
    await rig.archive("1_hold", True)

    res = await rig.remote_automation("1_hold", ok=False)
    assert "enable it first" in res["error"]["message"]
    await rig.check({"1_single": ["a"]})

    # its own automation switched off in HA: the card shows it off too
    await rig.clear("1_hold")
    await rig.save("1_hold", "own", materialized=True)
    entity_id = automation_entity_id(hass, rig.slot("1_hold")["automation_id"])
    await hass.services.async_call(
        "automation", "turn_off", {"entity_id": entity_id}, blocking=True
    )
    await rig.check({"1_single": ["a"]}, tap={"1_hold": ["own"]})
    res = await rig.remote_automation("1_hold", ok=False)
    assert "enable it first" in res["error"]["message"]
    await rig.check({"1_single": ["a"]}, tap={"1_hold": ["own"]})


async def test_native_per_remote_automation_next_to_ours(
    hass, hass_ws_client, remote_device
) -> None:
    """A native one-branch-per-event automation linked on button 1, the
    card's remote automation on button 2; then button 1 moves into ours."""
    native = {
        "id": "native_per_remote",
        "alias": "Pilot",
        "triggers": [
            device_trigger(remote_device, "1_single", "tap"),
            device_trigger(remote_device, "1_double", "double"),
        ],
        "actions": [
            {
                "choose": [
                    {
                        "conditions": [{"condition": "trigger", "id": "tap"}],
                        "sequence": seq("n1"),
                    },
                    {
                        "conditions": [{"condition": "trigger", "id": "double"}],
                        "sequence": seq("n2"),
                    },
                ]
            }
        ],
    }
    rig = await make_rig(hass, hass_ws_client, remote_device, [native])
    await rig.link("1_single", "automation.pilot")
    await rig.link("1_double", "automation.pilot")
    await rig.save("2_single", "a")
    await rig.save("2_double", "b")
    await rig.remote_automation("2_single")
    assert rig.shared() is not None
    assert {t["id"] for t in rig.shared()["triggers"]} == {
        "1_hold",
        "2_single",
        "2_double",
        "2_hold",
    }
    base = {"1_single": ["n1"], "1_double": ["n2"], "2_single": ["a"]}
    base |= {"2_double": ["b"]}
    await rig.check(base)

    await rig.move("2_single", "2_double")
    base |= {"2_single": ["b"], "2_double": ["a"]}
    await rig.check(base)

    await rig.untick("1_single")  # the native goes off whole: both absorbed
    assert hass.states.get("automation.pilot").state == "off"
    await rig.check(base)

    await rig.remote_automation("1_single")  # card slots join our automation
    await rig.remote_automation("1_double")
    await rig.move("1_single", "2_hold")  # onto an empty branch: swap
    base |= {"1_single": [], "2_hold": ["n1"]}
    await rig.check(base)
    await rig.clear("2_single")
    await rig.move("1_double", "2_single")  # onto a cleared event: re-keyed
    base |= {"1_double": [], "2_single": ["n2"]}
    await rig.check(base)
    assert {t["id"] for t in rig.shared()["triggers"]} == {
        "1_single",
        "1_hold",
        "2_single",
        "2_double",
        "2_hold",
    }


async def test_imported_merge_then_remote_automation(
    hass, hass_ws_client, remote_device
) -> None:
    """Two native automations on one event, imported as one slot, then made
    a branch and swapped: the press still runs both sources' actions once."""
    natives = [
        {
            "id": f"dup_{via}",
            "alias": f"Dup {via}",
            "triggers": [device_trigger(remote_device, "1_double")],
            "actions": seq(via),
        }
        for via in ("x", "y")
    ]
    rig = await make_rig(hass, hass_ws_client, remote_device, natives)
    await rig.check({"1_double": ["x", "y"]}, tap={"1_double": []})
    scan = (await rig.ws({"type": f"{DOMAIN}/scan_import", "entry_id": rig.entry_id}))[
        "result"
    ]
    await rig.ws(
        {
            "type": f"{DOMAIN}/apply_import",
            "entry_id": rig.entry_id,
            "proposals": scan["proposals"],
        }
    )
    await rig.check({"1_double": ["x", "y"]})

    await rig.remote_automation("1_double")
    await rig.move("1_double", "1_single")
    await rig.check({"1_single": ["x", "y"]})
    assert hass.states.get("automation.dup_x").state == "off"
    assert hass.states.get("automation.dup_y").state == "off"


# ── random walk ──────────────────────────────────────────────────────

# events with a native automation of their own, and what it runs
NATIVES = {"1_single": "N1", "2_double": "N2"}


def _native(device_id: str, event: str) -> dict:
    return {
        "id": f"native_{event}",
        "alias": f"Native {event}",
        "triggers": [device_trigger(device_id, event)],
        "actions": seq(NATIVES[event]),
    }


class Model:
    """What each event should run, from what the card shows for it.

    ``kind``: empty, plain (card-only), owned (its own automation), shared
    (a branch) or linked (a native automation). ``origin``: the native
    event whose actions an unlinked slot absorbed.
    """

    def __init__(self) -> None:
        self.kind = dict.fromkeys(EVENTS, "empty")
        self.via: dict[str, str | None] = dict.fromkeys(EVENTS)
        self.archived = dict.fromkeys(EVENTS, False)
        self.origin: dict[str, str | None] = dict.fromkeys(EVENTS)
        self.native_on = dict.fromkeys(NATIVES, True)
        self.disabled_by_us: set[str] = set()
        self._n = 0

    def fresh(self) -> str:
        self._n += 1
        return f"v{self._n}"

    def of(self, *kinds: str, archived: bool | None = None) -> list[str]:
        return [
            e
            for e in EVENTS
            if self.kind[e] in kinds
            and (archived is None or self.archived[e] == archived)
        ]

    def swap(self, a: str, b: str) -> None:
        for field in (self.kind, self.via, self.archived, self.origin):
            field[a], field[b] = field[b], field[a]

    def reset(self, event: str) -> None:
        self.kind[event], self.via[event] = "empty", None
        self.archived[event], self.origin[event] = False, None

    def _own(self, event: str) -> list[str]:
        if self.archived[event] or self.kind[event] not in ("plain", "owned", "shared"):
            return []
        return [self.via[event]] if self.via[event] else []

    def press(self) -> dict[str, list[str]]:
        """The slot's own actions plus a native automation that is on."""
        return {
            e: self._own(e) + ([NATIVES[e]] if self.native_on.get(e) else [])
            for e in EVENTS
        }

    def tap(self) -> dict[str, list[str]]:
        """A tap runs what the card binds: a linked native even when off."""
        return {
            e: [NATIVES[e]]
            if self.kind[e] == "linked" and not self.archived[e]
            else self._own(e)
            for e in EVENTS
        }


async def _step(rig: Rig, model: Model, rnd: random.Random) -> None:
    ops = ["edit", "edit", "move", "move", "move", "clear", "remote", "own"]
    ops += ["shell", "untick", "archive", "link"]
    while True:
        op = rnd.choice(ops)
        if op == "edit" and (events := model.of("empty", "plain", "owned", "shared")):
            event = rnd.choice(events)
            via = model.fresh()
            await rig.save(event, via)
            if model.kind[event] == "empty":
                model.kind[event] = "plain"
            model.via[event] = via
            return
        if op == "move" and (sources := model.of("plain", "owned", "shared")):
            source = rnd.choice(sources)
            target = rnd.choice(
                [e for e in EVENTS if e != source and model.kind[e] != "linked"]
            )
            await rig.move(source, target)
            model.swap(source, target)
            return
        set_events = [e for e in EVENTS if model.kind[e] != "empty"]
        if op == "clear" and (events := set_events):
            event = rnd.choice(events)
            await rig.clear(event)
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
            via = model.fresh()
            await rig.save(event, via, materialized=True)
            model.kind[event], model.via[event] = "owned", via
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
                model.via[event] = NATIVES[event]
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
                for e in NATIVES
                if model.kind[e] in ("empty", "plain") and not model.archived[e]
            ]
        ):
            event = rnd.choice(events)
            await rig.link(event, f"automation.native_{event}")
            model.kind[event], model.via[event] = "linked", None
            # back on only when this remote switched it off, and no other
            # card-only slot still runs its absorbed copy
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


def _assert_stored(rig: Rig, model: Model) -> None:
    """automations.yaml and the slots hold exactly what the model says."""
    items = rig.automations()
    want = {automation_config_id(rig.entry_id, e) for e in model.of("owned")}
    want |= {f"native_{e}" for e in NATIVES}
    shared = model.of("shared")
    if shared:
        want.add(remote_automation_config_id(rig.entry_id))
    assert set(items) == want, rig.log
    if shared:
        raw = items[remote_automation_config_id(rig.entry_id)]
        assert sorted(t["id"] for t in raw["triggers"]) == sorted(shared), rig.log
        branches = [b["conditions"][0]["id"] for b in raw["actions"][0]["choose"]]
        assert sorted(branches) == sorted(shared), rig.log
    for e in EVENTS:
        slot = rig.slot(e)
        kind = model.kind[e]
        if kind == "empty":
            assert slot is None, (e, rig.log)
            continue
        assert slot is not None, (e, rig.log)
        assert bool(slot.get("materialized")) == (kind != "plain"), (e, rig.log)
        assert bool(slot.get("shared_automation")) == (kind == "shared"), (e, rig.log)
        assert (slot.get("owned") is False) == (kind == "linked"), (e, rig.log)
        assert bool(slot.get("archived")) == model.archived[e], (e, rig.log)
    for e, on in model.native_on.items():
        state = rig.hass.states.get(f"automation.native_{e}").state
        assert state == ("on" if on else "off"), (e, rig.log)


@pytest.mark.parametrize("seed", range(WALK_SEEDS))
async def test_random_walk(hass, hass_ws_client, remote_device, seed: int) -> None:
    """Card operations in random order; after each, every press and tap
    runs what the model says, once."""
    natives = [_native(remote_device, e) for e in NATIVES]
    rig = await make_rig(hass, hass_ws_client, remote_device, natives)
    model = Model()
    rnd = random.Random(seed)
    for _ in range(WALK_STEPS):
        await _step(rig, model, rnd)
        _assert_stored(rig, model)
        await rig.check(model.press(), tap=model.tap())

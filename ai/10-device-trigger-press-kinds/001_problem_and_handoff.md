# Device-trigger press kinds — the adapter drops them for ZHA, deCONZ, Hue and Z-Wave

Status: step 1 of §Recommended order done on 2026-10-14 (fixtures, script,
catalog test; see the note under that table). Steps 2–5 open. Found while planning
`ai/09-group-actions-into-buttons.md`. Line numbers below are against
`master` at `e851c75`; plan 09 is being implemented in the main checkout
as this is written and moves things in `buttons.py` and `naming.py`.

## The short version

1. HA device triggers are a `(type, subtype)` pair. The adapter keeps the
   subtype alone as the action id (`adapters/device_trigger.py:148`) and
   attaches every type that carries that subtype to the same id
   (`:198`–`:205`). On Zigbee2MQTT the type is always `action` and the
   subtype carries everything, so nothing is lost. On the other
   device-trigger platforms the pair is split the other way round:
   subtype = button, type = press kind.
2. Measured against the catalogs those platforms ship: deCONZ, 135 of 176
   subtypes (77 %) sit under more than one type; ZHA v1 quirks, 334 of
   475 (70 %). Every one of those becomes a single action that fires on
   short press, long press, release and double press alike, and the card
   shows one `press` event per button.
3. Z-Wave JS central-scene triggers never carry the kind in the
   enumerated trigger at all: it is an optional `value` field the UI adds
   from the value's states (`zwave_js/device_trigger.py:119`, `:536`).
   The adapter attaches the trigger without it, so one action per scene
   fires on every key attribute.
4. Plan 09 (grouping) cannot repair this. It places action ids on
   buttons; here there is only one id where there should be four.
5. The Z2M catalog test (`tests/test_z2m_catalog.py`, 417 devices, 3124
   actions) has no counterpart for these platforms, so the collapse has
   never shown up in a test.

## Checked, do not re-investigate

- **Z2M is unaffected.** All 3124 action ids in
  `tests/fixtures/z2m_actions.json` arrive as subtype under the single
  type `action`; none contains `:` (checked 2026-10-14), so a `subtype:type`
  id scheme cannot collide with an existing Z2M id.
- **`build_trigger` is not where the loss happens.** It matches on
  subtype only (`device_trigger.py:159`) and returns the first probed
  trigger; the loss is upstream, in `async_default_actions` deduplicating
  by subtype. Both have to change together, see §Why.
- **The Matter adapter already uses `token:event` ids**
  (`adapters/matter.py:99`, `:104`, `:136`) and `split_action` honours
  the colon for that source (`buttons.py:134`). The same shape for
  device triggers is a precedent, not a new convention.
- **deCONZ's catalog cannot be imported in this venv.**
  `from homeassistant.components.deconz.device_trigger import REMOTES`
  fails on `ModuleNotFoundError: pydeconz`. Parse the file with `ast`
  instead (command in §Queries); the tables are literal dicts.
- **zha-quirks is not a dependency and not installed.** `uv run
  --no-project --with zha-quirks` gives an ephemeral env (41 packages,
  version 2.3.0 on 2026-10-14). Only v1 quirks (`CustomDevice`
  subclasses with `device_automation_triggers`) were counted; v2 quirks
  built with `QuirkBuilder` register elsewhere and
  `zigpy.quirks.DEVICE_REGISTRY` is deprecated in favour of
  `zhaquirks.legacy`, which holds v1 only. Their count is open (§Open).
- **The dev HA has no ZHA, deCONZ, Hue or Z-Wave device**, and the
  Playwright/Chrome checks cannot produce one. The MQTT discovery
  fixture in `tests/conftest.py:60` (`remote_device`) publishes device
  triggers with an arbitrary `type` and `subtype` (`:71`–`:72`), so a
  ZHA-shaped device is one fixture away: publish `type:
  remote_button_short_press, subtype: turn_on` and so on. No real radio
  needed.

## Why it happens

Order of calls for a device-trigger remote:

1. `DeviceTriggerAdapter.async_default_actions` (`device_trigger.py:137`)
   probes `async_get_device_automations(TRIGGER)` and collects
   `str(trigger["subtype"])` into an ordered set (`:148`). Two triggers
   `("remote_button_short_press", "turn_on")` and
   `("remote_button_long_press", "turn_on")` collapse to `turn_on`.
2. The config flow stores that list as `layout.actions`; the card groups
   it with `group_buttons("device_trigger", …)` (`buttons.py:142`), whose
   `split_z2m_action` (`:107`) finds no event token in `turn_on` and
   makes it a button with one event `press`.
3. `async_subscribe` (`:183`) indexes the probed triggers by subtype
   (`:198`) and attaches every match under the same trigger `id`
   (`:205`), by design ("attach all, same action id", `:204`). Short and
   long press both reach `on_action("turn_on", …)`.
4. `build_trigger` (`:151`) returns the first probed trigger with that
   subtype (`:159`), so an automation the card writes listens to one
   press kind, which one depending on probe order, while the card's own
   dispatcher listens to all of them. The two paths disagree today.

Per platform, what the pair looks like (HA 2026.7.2 in `.venv`):

| platform | file | type | subtype |
|---|---|---|---|
| ZHA | `zha/device_trigger.py:38`, `:53` | `remote_button_short_press`, `…_long_press`, `…_short_release`, `…_long_release`, `…_double_press`, `…_triple_press`, `…_quadruple_press`, `…_quintuple_press`, `…_alt_*`, `device_*` (cube), plus quirk-specific ones | `turn_on`, `dim_up`, `button_1`, `left`, `both_buttons`, … |
| deCONZ | `deconz/device_trigger.py:35`–`:62` consts, `:94` Hue dimmer, `:617` `REMOTES` | same vocabulary as ZHA, `remote_*` for the cube | same |
| Hue v2 | `hue/v2/device_trigger.py:96`–`:110`; vocabulary `hue/const.py:45`–`:63` | `initial_press`, `repeat`, `short_release`, `long_press`, `long_release` (Hue tap: `initial_press` only); rotary `start`/`repeat` × `clock_wise`/`counter_clock_wise` | button `control_id` (1, 2, 3, 4) |
| Z-Wave JS | `zwave_js/device_trigger.py:290`–`:305`, `:119`, `:536` | one type, `event.value_notification.central_scene`; the kind is `value` (KeyPressed, KeyReleased, KeyHeldDown, KeyPressed2x … 5x) from the value's states | `Endpoint 0 Scene 001` |
| Z2M via MQTT | `mqtt/device_trigger.py` | `action` | the whole action name |

## Design, proposed in chat on 2026-10-14, not yet confirmed

1. **Id scheme.** The action id stays the bare subtype when the subtype
   appears under exactly one type (every Z2M remote, every stored layout
   today). When it appears under several, the id becomes `subtype:type`,
   one per pair, Matter-style. Constraint: no existing Z2M or Matter id
   changes.
2. **Both adapter paths use the pair.** `async_default_actions` emits one
   id per pair for multi-type subtypes; `async_subscribe` attaches
   exactly the matching trigger per id; `build_trigger` matches on both
   and, for a never-probed `subtype:type` id, builds the placeholder with
   both fields. The card and the written automation then listen to the
   same thing.
3. **Kinds from the type.** `buttons.py` gets a `_KIND_BY_TYPE` table
   next to `_KIND_BY_EVENT` (`:51`), and `split_action` (`:132`) honours
   the colon for `device_trigger` as it does for Matter: button = subtype,
   event = type, kind from the table. Starting table, to be checked
   against the fixtures once they exist:

   | type | kind |
   |---|---|
   | `remote_button_short_press`, Hue `short_release` | single |
   | `remote_button_double_press` | double |
   | `remote_button_triple_press` | triple |
   | `remote_button_long_press`, Hue `long_press` | hold |
   | `remote_button_short_release`, `remote_button_long_release`, Hue `long_release` | release |
   | everything else (`…_quadruple_press`, `…_alt_*`, `device_*`, `remote_*`, Hue `initial_press`, `repeat`, unknown) | other |

4. **Z-Wave gets the kinds from the value states.** The probe reads
   `value.metadata.states` of the central-scene value the trigger names
   and emits `Endpoint 0 Scene 001:KeyPressed` and so on; `build_trigger`
   adds `value: <state int>`; the kind table maps KeyPressed → single,
   KeyReleased → release, KeyHeldDown → hold, KeyPressed2x → double,
   KeyPressed3x → triple, 4x and 5x → other.
5. **One fixture per platform, same shape as `z2m_actions.json`**, with
   `triggers: [[type, subtype], …]` per device next to the expected
   buttons, and a parametrized test like `tests/test_z2m_catalog.py`.
   Sources: deCONZ from HA's own file (56 models, 40 distinct tables, 536
   pairs); ZHA from zha-quirks (130 v1 quirk classes, 1426 pairs); Hue
   written by hand from `hue/const.py` (five events × four buttons, plus
   the tap); Z-Wave a vocabulary fixture only, there is no per-device
   catalog.

Open, see §Open questions: migration of stored ZHA layouts, Hue
`initial_press` on the tap switch, Z-Wave button labels, ZHA's
quirk-specific type names.

## Recommended order of work

| step | what | ships alone? |
|---|---|---|
| 1 | Fixture script `scripts/device_triggers.py` (deCONZ via `ast`, ZHA via the `uv run --with zha-quirks` walk, Hue by hand) writing `tests/fixtures/{deconz,zha,hue}_triggers.json`, and `tests/test_trigger_catalogs.py` asserting today's grouping. | Yes. Pins the collapse so step 2 shows up as a fixture diff, like a Z2M parser change does. |
| 2 | Adapter: pair-aware `async_default_actions`, `async_subscribe`, `build_trigger`; `_KIND_BY_TYPE` and the colon in `split_action`; regroup the fixtures. | Yes, and this is the step that stops the bleeding for ZHA, deCONZ and Hue. Ship it before the Z-Wave work. |
| 3 | Migration for existing device-trigger remotes whose stored ids were collapsed (§Open 1). | With step 2 or right after; without it a ZHA user who refreshes sees stale badges. |
| 4 | Z-Wave: value states in the probe, `value` in `build_trigger`, vocabulary fixture. | Yes, separate. Needs a node fixture; nothing in the test rig has one yet. |
| 5 | README "Supported remotes" table: ZHA, deCONZ, Hue v2 and Z-Wave rows with "press kinds" instead of "should work, untested". | After 2 and 4. |

Step 1 landed on 2026-10-14 (branch `device-trigger-fixtures`):

- `scripts/device_triggers.py` writes the three fixtures; run it with
  `uv run --with zha-quirks python scripts/device_triggers.py`. The
  `--with` layers zha-quirks 2.3.0 on the project venv, nothing is added
  to `pyproject.toml`. `--regroup` recomputes ids and buttons from the
  saved pairs after an adapter or parser change; today it is a no-op diff.
- The adapter's id rule is now the pure
  `action_ids_from_triggers(triggers)` in `adapters/device_trigger.py`,
  called by `async_default_actions`; the script and the test use it, so
  step 2 changes that function and regroups.
- `tests/test_trigger_catalogs.py`: per device, ids match the fixture,
  grouping matches, every id sits on one button, and
  `test_one_action_per_pair` is a strict xfail wherever the fixture
  recorded fewer ids than pairs. The marks are computed from the fixture,
  so a regroup after step 2 clears them without an edit.
- Counts: deCONZ 56 devices, 536 pairs, 176 ids, 51 devices collapsed;
  ZHA 166 quirks (130 v1 classes, 36 v2 entries), 2046 pairs, 768 ids,
  138 collapsed; Hue 5 models by hand, 63 pairs, 17 ids, 4 collapsed.
  193 xfails in total.
- Every ZHA device also enumerates `("device_offline", "device_offline")`
  (`zha/zigbee/device.py:149`); the fixture includes it, so today's
  adapter lists `device_offline` as an action on every ZHA remote. Decide
  in step 2 whether to filter it.
- 22 of the ZHA v1 entries are base classes with triggers and no models
  (IKEA, Tuya bases); their subclasses appear with models of their own.

Plan 09 does not depend on any of this and this does not depend on 09.
They touch `buttons.py` in different places (`_KIND_BY_TYPE` and
`split_action` here; `place_action`, `grouping_conflict` there).

## Files

| path | why |
|---|---|
| `custom_components/remote_mapper/adapters/device_trigger.py:137`–`:149` | `async_default_actions`, the subtype-only dedup at `:148` |
| `…/adapters/device_trigger.py:151`–`:181` | `build_trigger` and `_template_trigger`; `:159` matches subtype only; the placeholder at `:176`–`:181` assumes Z2M's `type: action` |
| `…/adapters/device_trigger.py:183`–`:238` | `async_subscribe`; `:198` indexes by subtype, `:204`–`:205` attaches all types under one id |
| `…/adapters/matter.py:99`, `:104`, `:136` | the `token:event` precedent |
| `…/buttons.py:51`, `:107`, `:132`–`:140` | `_KIND_BY_EVENT`, `split_z2m_action`, `split_action` with the Matter colon case; plan 09 adds `place_action`, which calls `split_action`, so the colon case lands in both |
| `…/naming.py:41` | `event_label` builds aliases from `split_action` (or `place_action` once 09 lands); a `subtype:type` id must read as "turn_on short press", not the raw id |
| `…/__init__.py:219`–`:260` | `async_refresh_actions`: added ids join the layout, missing ids go stale; this is where a collapsed `turn_on` meets its new `turn_on:…` siblings (§Open 1) |
| `…/materializer.py` | writes `build_trigger` output into automations; after step 2 an automation for `turn_on:remote_button_long_press` must carry `type: remote_button_long_press` |
| `tests/conftest.py:60`–`:95` | `remote_device` (MQTT discovery, arbitrary type/subtype) and `fire_remote_action`; the ZHA-shaped fixture goes next to it |
| `tests/test_device_trigger_adapter.py` | conformance tests to extend: a multi-type subtype yields one id per pair, `build_trigger` round-trips both fields |
| `tests/test_z2m_catalog.py`, `scripts/z2m_actions.py`, `tests/fixtures/z2m_actions.json` | the pattern to copy for the new fixtures; the Z2M fixture itself must not change |
| `.venv/lib/python3.14/site-packages/homeassistant/components/{zha,deconz,hue/v2,zwave_js,mqtt}/device_trigger.py` | the upstream shapes, line numbers in §Why; HA 2026.7.2 |

## How to work

- Branch off `master`. Plan 09 is being implemented in the main checkout
  (`buttons.py`, `websocket.py`, `store.py`, `naming.py`, the card); work
  in a worktree and rebase once 09 is committed, since both touch
  `buttons.py`.
- Python changes: `make test` (pytest, vitest, build), `make lint` (ruff).
  Dev HA needs `docker compose -f docker/compose.yaml restart
  homeassistant` for Python changes; see `ai/local-ha-testing.md`.
- A filtered run that matched nothing prints `no tests ran` with pytest
  and exit code 5; `uv run pytest tests/test_trigger_catalogs.py -q` must
  report the parametrized count, in the hundreds once the fixtures exist.
- Deploy to the user's production HA is the user's rsync, never the
  session's.
- The `uv run --no-project --with zha-quirks` command below is the only
  command here that reaches the network; it is ephemeral and leaves the
  project venv alone.

## Queries and commands that establish state

deCONZ catalog from HA's source, no `pydeconz` needed (run 2026-10-14,
HA 2026.7.2; output `models 56 tables 40 pairs 536 subtypes 176 subtypes
under >1 type 135`):

```sh
.venv/bin/python - <<'EOF'
import ast, pathlib
src = pathlib.Path('.venv/lib/python3.14/site-packages/homeassistant/components/deconz/device_trigger.py').read_text()
tree = ast.parse(src)
consts, tables = {}, {}
def val(e): return e.value if isinstance(e, ast.Constant) else consts[e.id]
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        name = node.targets[0].id
        if isinstance(node.value, ast.Constant): consts[name] = node.value.value
        elif isinstance(node.value, ast.Dict) and name != 'REMOTES':
            keys = [k for k in node.value.keys if isinstance(k, ast.Tuple)]
            if keys: tables[name] = [(val(k.elts[0]), val(k.elts[1])) for k in keys]
        elif name == 'REMOTES':
            remotes = {val(k): v.id for k, v in zip(node.value.keys, node.value.values)}
pairs = sum(len(tables[t]) for t in remotes.values())
multi = 0; subs = 0
for t in remotes.values():
    by = {}
    for ty, su in tables[t]: by.setdefault(su, set()).add(ty)
    subs += len(by); multi += sum(len(v) > 1 for v in by.values())
print('models', len(remotes), 'tables', len(set(remotes.values())), 'pairs', pairs, 'subtypes', subs, 'subtypes under >1 type', multi)
EOF
```

Trap: some tuple keys are string literals, not names (`val` handles
both); the first version of this script crashed on `'Constant' object
has no attribute 'id'`.

ZHA v1 quirk catalog (run 2026-10-14, zha-quirks 2.3.0, zigpy 2.3.0;
output `modules 463 import errors 0`, `v1 quirk classes with triggers
130 pairs 1426 subtypes 475 subtypes under >1 type 334`):

```sh
uv run --no-project --with zha-quirks python - <<'EOF'
import importlib, pkgutil, zhaquirks, inspect
from zhaquirks import CustomDevice
classes = {}
for m in pkgutil.walk_packages(zhaquirks.__path__, 'zhaquirks.'):
    mod = importlib.import_module(m.name)
    for name, cls in inspect.getmembers(mod, inspect.isclass):
        if cls.__module__ == m.name and issubclass(cls, CustomDevice):
            t = getattr(cls, 'device_automation_triggers', None)
            if t: classes[f'{m.name}.{name}'] = t
pairs = sum(len(t) for t in classes.values())
multi = 0; subs = 0
for t in classes.values():
    by = {}
    for ty, su in t: by.setdefault(su, set()).add(ty)
    subs += len(by); multi += sum(len(v) > 1 for v in by.values())
print('v1 quirk classes with triggers', len(classes), 'pairs', pairs, 'subtypes', subs, 'subtypes under >1 type', multi)
print(sorted({str(ty) for t in classes.values() for ty, su in t}))
EOF
```

The type list that printed, beyond the HA constants: `Approach`, `Away`,
`Enter`, `Enter_Left`, `Enter_Right`, `Leave`, `Leave_Left`,
`Leave_Right`, `Unknown`, `button_double`, `button_hold`,
`button_single`, `color_down`, `color_up`, `dim_down`, `dim_up`,
`double`, `hold`, `initial_switch_press`, `release`. Some quirks put the
kind in the type and the button in the subtype the other way round
(`button_single` as a type); the fixture will show which, and
`_KIND_BY_TYPE` should map `button_single`/`double`/`hold`/`release` and
friends like their Z2M namesakes.

Trap: `zigpy.quirks.DEVICE_REGISTRY` prints a deprecation and holds v1
only; the walk above does not need it.

Z2M fixture check (run 2026-10-14): `417 devices 3124 actions 0 with
colon`:

```sh
python3 -c "
import json; d=json.load(open('tests/fixtures/z2m_actions.json'))
acts=[a for x in d['devices'] for a in x['actions']]; print(len(d['devices']),'devices',len(acts),'actions', sum(':' in a for a in acts),'with colon')"
```

## Success criteria

1. `tests/test_trigger_catalogs.py` runs one case per deCONZ model (56)
   and per ZHA v1 quirk class (130) plus the Hue list, and asserts that
   the number of action ids equals the number of `(type, subtype)` pairs
   for every device: nothing collapsed. This test must fail on today's
   adapter for every multi-type device (135 deCONZ subtypes, 334 ZHA).
2. `tests/test_z2m_catalog.py` passes unchanged and
   `tests/fixtures/z2m_actions.json` has no diff.
3. An MQTT-discovered device with `("remote_button_short_press",
   "turn_on")` and `("remote_button_long_press", "turn_on")` yields the
   ids `turn_on:remote_button_short_press` and
   `turn_on:remote_button_long_press`; `fire_remote_action` on the long
   one reaches only the long slot (conformance test next to
   `test_subscribe_fires_and_unsubscribes`).
4. `build_trigger("turn_on:remote_button_long_press", …)` returns a dict
   with both `type` and `subtype`, and passes
   `async_validate_trigger_config` (extend
   `test_build_trigger_conformance`).
5. `group_buttons("device_trigger", [...those ids...])` yields one button
   `turn_on` with kinds single and hold; `event_label` reads
   `turn_on remote_button_long_press` or better (§Open 4).
6. A stored layout with the collapsed id `turn_on` and a slot on it
   survives a refresh without the slot becoming unreachable (whatever
   §Open 1 decides, prove it with a test in `tests/test_init.py`).

## Open questions

1. **Migration of collapsed ids.** A ZHA remote added before this change
   has `turn_on` in `layout.actions`, maybe with a slot. After the
   change, refresh adds `turn_on:remote_button_short_press` and friends
   and marks `turn_on` stale (`__init__.py:233`–`:245`); the slot stays
   on the stale id, reachable only through the stale badge and the Move…
   picker. Options: leave it and say so in the changelog (the Move…
   picker exists), or move the slot to the short-press id when that id
   appears and the stale one had a slot. Which press kind the user meant
   is unknowable; short press is the common case. The user decides.
2. **Hue `initial_press`.** On the Hue tap switch it is the only event,
   so it is the single press there; on the dimmer `short_release` is the
   click and `initial_press` fires before every kind. Mapping
   `initial_press` to single would put two singles on a dimmer button
   (plan 09 refuses that for overrides, and `actionOfKind` takes the
   first). Either map it to other and let a tap-switch user regroup once
   09 ships, or special-case "single when it is the button's only type".
3. **Z-Wave button labels.** `Endpoint 0 Scene 001` is the subtype; the
   grid cell would read that. `split_action` could shorten it to `1`
   for the device-trigger source when the subtype matches `Endpoint \d+
   Scene (\d+)`, or the user renames with the label field. Also whether
   to key the id on the raw subtype or the shortened form (the id must
   round-trip to the trigger, so the raw subtype is safer).
4. **Event names in the card.** With the colon scheme the event shows as
   the type, `remote_button_long_press`, which is long in a chip and in
   an alias. A display table (type → "long press") next to the kind
   table would fix the card and `event_label` at once; decide whether
   that belongs in `buttons.py` (server, one place) or the card.
5. **ZHA v2 quirks**: resolved in step 1. `QuirkBuilder.add_to_registry`
   compiles into `zha.quirks.DeviceRegistry._registry` (the default
   `QuirkBuilder(...).registry`) at import time; each entry's
   `zha_device_factory.quirk_definition.device_automation_triggers` is
   reachable without a zigpy application. 36 entries carry triggers; the
   fixture holds them as `quirk_version: 2`.
6. **Devices with one type per subtype keep bare ids**, so a device that
   later gains a second type for a subtype (a quirk update) would change
   its id scheme on refresh. Rare; the same migration as 1 covers it.

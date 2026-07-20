# Remote Mapper — implementation plan (v5)

> Supersedes v4 (git history). Inputs: `../remote-mapper-design.md`, exploration
> of widget-canvas-ha + zhsunyco-esl, verification in `02-verification-notes.md`,
> user's real automations, a 4-agent plan-judge audit (v4 folded in all its
> fixes; HA core source verified locally at `/home/shared/repos/core`), and the
> canvas-reuse decision (v5: consume engine as npm git dependency instead of
> copying — §1.13).
> Target HA: 2026.7.x; HACS min: 2025.7.0; **Python ≥ 3.14** (PHACC tracking
> HA 2026.7 requires it — pyproject already bumped).

## 1. Architectural decisions (locked)

1. **Integration shape**: per-remote config entries (wolink_esl model:
   `integration_type: "device"`, `async_set_unique_id` dedupe), NOT
   singleton+subentries. Each remote = one entry; entry unload = adapter
   unsubscribe. **On entry setup, attach the entry to the remote's existing
   registry device**: `dr.async_update_device(device_id,
   add_config_entry_id=entry.entry_id)` (core `device_registry.py:1016`) —
   gives a device page grouping our slots/automations. Optional (decide M1):
   diagnostic sensors `last_action`/`last_error` copying edm's
   `_device_info`/`_unique_id` helpers (`sensor.py:38-55`).
2. **Registration split** (edm pattern): `async_setup()` registers WS commands
   + frontend once per boot (frontend deferred via
   `EVENT_HOMEASSISTANT_STARTED` unless `CoreState.running`);
   `async_setup_entry()` only does store-load + device attach + adapter
   subscribe per remote.
3. **Storage**: `helpers.storage.Store[RemoteMapperData]`. Mutations update
   in-memory data + `Store.async_delay_save` (~1–2 s; flush on unload) —
   never await `async_save` per WS call (canvas drags and slot saves burst).
   Lift esl's orphan-cleanup structure (diff live ids vs stored artifacts at
   entry setup, tolerate individual failures) for owned_scenes pruning.
4. **Primary adapter = `device_trigger`.** User's remotes are Z2M devices
   exposing MQTT device triggers (`{trigger: device, domain: mqtt, device_id,
   type: action, subtype: "1_single"}`). One adapter covers Z2M + ZHA +
   anything publishing device triggers. Verified API precision:
   - Enumerate: `from homeassistant.components.device_automation import
     DeviceAutomationType, async_get_device_automations`;
     `await async_get_device_automations(hass, DeviceAutomationType.TRIGGER,
     [device_id])` → **`Mapping[device_id, list[dict]]`** (index by device_id,
     not flat); raises `DeviceNotFound` for deleted devices — wrap. MQTT
     dicts arrive as `{platform: "device", domain: "mqtt", device_id, type,
     subtype}` (internal form, ready to attach).
   - Subscribe: `helpers.trigger.async_initialize_triggers(hass, configs,
     action, DOMAIN, name, log_cb)` → returns **`CALLBACK_TYPE | None`** —
     `None` means every attach failed/skipped (errors surface only via
     `log_cb`, no exception). Treat `None` as subscribe-failure. Precedent:
     HomeKit `homekit/type_triggers.py:102`.
   - Stored/user-edited trigger dicts must be normalized to internal
     `platform:` form first: `cv.TRIGGER_SCHEMA` (rewrites `trigger:` →
     `platform:`) then `await helpers.trigger.async_validate_trigger_config`
     (generic TRIGGER_SCHEMA alone passes garbage subtypes — real validation
     is per-platform).
   - **Z2M discovery is lazy**: device-trigger discovery for an action
     publishes only after that action fires once. Probe may return a partial
     subtype set → config flow prompts "press each button now", supports
     re-probe; drift-diff (M7) **adds** newly discovered subtypes as well as
     flagging removals. Attaching not-yet-discovered subtypes is safe (MQTT
     placeholder trigger arms on discovery, `mqtt/device_trigger.py:399-411`).
   - `build_trigger()` = identity dict; `action_id` := `subtype`.
   Subsumes `zha_event`; fallbacks: `z2m_mqtt` raw topic, `event_entity`,
   `mqtt_generic`.
5. **Materializer is in-process, NOT REST.** Plan-judge P0: the
   `/api/config/...` views are `@require_admin` HTTP views — backend code has
   no user token; no WS/storage write API exists. The views themselves just
   edit the yaml files (`config/view.py:87-161`). So `materializer.py` /
   `scene_api.py` replicate that in-process:
   - Read: automation entity `raw_config` (same source the read-only WS
     `automation/config` serves).
   - Write: executor `load_yaml(hass.config.path("automations.yaml"))` →
     upsert entry by `id` (preserve others) → `write_utf8_file_atomic` →
     `await hass.services.async_call("automation", "reload", {"id": ...})`
     (targeted reload, same as the view's post_write_hook; scenes:
     `scenes.yaml` + `scene.reload`).
   - One internal `asyncio.Lock` serializes all our writes; accepted small
     race window vs simultaneous UI edits (the view's own mutation_lock is
     inaccessible). Payloads use plural `triggers/conditions/actions`.
   - Scope fact: this store covers UI-managed automations only —
     package/other-YAML automations are invisible (fine: we only manage our
     own + import UI-created ones).
6. **Card push-updates via bus event** (edm backend pattern,
   `__init__.py:478-481`): every mutating handler (slot save/clear, import
   apply, materialize, snapshot) fires
   `hass.bus.async_fire("remote_mapper_updated", {"entry_id": ..., "kind": ...})`.
   Card side written fresh (edm never implemented it):
   `hass.connection.subscribeEvents(cb, "remote_mapper_updated")`,
   unsubscribe in `disconnectedCallback`, refetch on event.
7. **Card layout persistence**: server-side in our Store via WS. Layout
   belongs to the remote, not a dashboard card instance; skips widget-canvas
   self-save machinery. Canvas geometry model kept.
8. **Slot editor tiers 1–2 = `ha-form` + selector schemas** via
   `ha-loader.ts` boilerplate-card trick; tier 3 = `ha-yaml-editor` with
   `<textarea>` fallback. Sequences validated server-side before persist:
   `cv.SCRIPT_SCHEMA` + `await helpers.script.async_validate_actions_config`
   (what automation itself does; required for device actions), then
   `Script(hass, seq, name, DOMAIN)` + `async_run(context=Context(...))` —
   always a real Context (Script warns on None).
9. **Version guards**: element-presence detection only. Min HA in `hacs.json`.
10. **Import assistant is v1 scope** (§5), scheduled M3.
11. **WS command naming**: flat edm style — `remote_mapper/get_slot`,
    `save_slot`, `clear_slot`, `archive_slot`, `probe_device`, `save_layout`,
    `scan_import`, `apply_import`, `create_snapshot`.
12. **Python style** (esl convention): `from __future__ import annotations`
    everywhere, `TYPE_CHECKING`-guarded imports, `Final` constants,
    `INTEGRATION_VERSION` read from manifest.json (edm `const.py:9-11`).
13. **Canvas engine = npm git dependency, not a copy.** Small upstream change
    in widget-canvas: `src/lib.ts` exporting `EditController`/`EditHost`,
    `session.ts`, `computeTransform`, zorder fns, snap helpers (all verified
    free of card-specific imports). remote-mapper pins
    `"widget-canvas-ha": "github:<owner>/widget-canvas-ha#<tag>"` in
    `frontend/package.json`; rollup bundles it into `www/` at build time —
    HACS and end users unaffected (built output committed). Upstream
    drag/pointer/undo fixes flow via tag bumps; tag pin means upstream churn
    can't break builds unexpectedly. Stays remote-mapper-local: render layer
    (`slot-tile`), server-side layout persistence, edit chrome (copied for
    now — lib-export candidate later, §8). Rejected alternatives: esl-style
    monorepo (widget-canvas has its own HACS plugin life), runtime embedding
    via `kind:"card"` (layout would land in dashboard config, fights §1.7).

## 2. Repo layout

```
ha-remote-mapper/
├── custom_components/remote_mapper/
│   ├── __init__.py            # async_setup (WS+frontend once) / async_setup_entry (per remote)
│   ├── manifest.json          # config_flow, integration_type: device,
│   │                          # dependencies: [frontend, http, device_automation],
│   │                          # after_dependencies: [lovelace, mqtt, zha]
│   ├── config_flow.py         # device picker → probe (press-each-button UX) → layout prefill;
│   │                          # title via device registry name (edm _derive_title analog);
│   │                          # options flow schema from selector() dicts (edm _reconfigure_schema;
│   │                          # entity-multiple selector for snapshot_entities)
│   ├── const.py               # DOMAIN, URL_BASE=/hacsfiles/remote_mapper, JSMODULES,
│   │                          # alias prefixes, option keys (Final-typed)
│   ├── store.py               # Store[RemoteMapperData] v1, async_delay_save, migrations,
│   │                          # owned_scenes pruning
│   ├── dispatcher.py          # on_action → slot lookup → validated Script run
│   ├── materializer.py        # in-process automations.yaml upsert + targeted reload (§1.5)
│   ├── scene_api.py           # in-process scenes.yaml upsert + scene.reload
│   ├── snapshot.py            # capture states → persistent scene + owned_scenes registry
│   ├── importer.py            # automations_with_device scan → slot proposals (§5)
│   ├── websocket.py           # flat remote_mapper/* commands; fires remote_mapper_updated
│   ├── sensor.py              # (optional, decide M1) diagnostic last_action/last_error
│   ├── adapters/              # base.py Protocol + device_trigger, z2m_mqtt,
│   │                          # event_entity, mqtt_generic
│   ├── frontend/
│   │   ├── __init__.py        # JSModuleRegistration (edm copy, domain-adapted)
│   │   ├── src/               # TS: card, canvas engine (lifted), editor, ha-loader
│   │   ├── rollup.config.js   # single entry → ../www/remote-mapper-card.js
│   │   └── package.json       # lit ^3.x + widget-canvas-ha (npm git dep, tag-pinned, §1.13)
│   ├── www/                   # committed build output
│   ├── strings.json           # sections: config (steps/abort) + options; mirrored in
│   └── translations/en.json   # translations (no config_subentries — per-device entries)
├── tests/                     # pytest-homeassistant-custom-component (Python ≥3.14)
├── e2e/                       # Playwright vs dockerized HA (greenfield)
├── docker/                    # compose: HA stable + mosquitto (+ optional Z2M)
├── hacs.json                  # homeassistant: "2025.7.0"
├── VERSION                    # synced by make bump-version
├── Makefile                   # bump-version syncs: manifest.json, frontend/package.json,
│                              # pyproject.toml, VERSION (esl Makefile:52-171 derived)
└── pyproject.toml             # requires-python >= 3.14
```

Note: future `ai/` topics use the `NNN-topic-name/` folder convention (both
reference repos; save-doc/save-plan skills assume it). Current flat files stay.

## 3. Reuse map (concrete)

| Need | Take from | Adaptation |
|---|---|---|
| Frontend reg (static path + resource + `?v=` cache-bust) | edm `frontend/__init__.py`, `const.py:9-21` | rename domain; keep `LOVELACE_DATA` + `.resource_mode == "storage"` guard |
| WS command file structure | edm `__init__.py:499-892` | own `websocket.py`; flat naming; share vol schemas config-flow ↔ WS |
| Bus-event fire on mutate | edm `__init__.py:478-481`, `config_flow.py:340-343` | event `remote_mapper_updated`; card subscribe side written fresh |
| Config flow skeleton | wolink `config_flow.py:40-218` | unique_id = HA `device_id` (device_trigger) / topic (raw MQTT); NO manual `OptionsFlow.config_entry` |
| Flow helpers (title derive, probe-in-flow, selector options schema) | edm `config_flow.py:57-73, 98-160` | analogs, not verbatim |
| Device attach + diagnostic entities | core `dr.async_update_device(add_config_entry_id=)`; edm `sensor.py:38-55` helpers | per-remote entry |
| Entry migration example | edm `__init__.py:138-264` | reference only |
| In-process config-store writes | core `config/view.py:87-161` (`_write_value`), `config/automation.py:25-35` | replicate: yaml upsert + atomic write + targeted reload; id↔entity_id map via `er.async_get_entity_id` |
| Import scan | core `automation.automations_with_device`, entity `raw_config` | no REST |
| Canvas edit engine | widget-canvas `src/editor/edit-controller.ts` (EditHost :8-21) + `session.ts`, `render/scaling.ts`, `model/zorder.ts`, `model/migrate.ts` snap fns | **npm git dep via new upstream `src/lib.ts` export (§1.13)** — import, don't copy; implement `EditHost`; render layer rewritten, one widget kind: `slot-tile` |
| Edit-mode chrome | widget-canvas `widget-canvas-card.ts`: chipbar :962-997, pencil :904 (+CSS :535-547), banner :1077-1093, D-pad :999-1075 | copy for now (not in lib export yet); skip `add-picker.ts` (slots come from probe) |
| Native toast | DDC `src/storage/layout-persistence.js:491-494` | dispatch `hass-notification` window event — no custom toast div |
| Embedded HA components | widget-canvas `src/editor/ha-loader.ts`, `src/util/actions.ts` | near-verbatim copy |
| YAML-tier fallback | widget-canvas `src/editor/widget-settings.ts:350-376` | same |
| Build config | edm `frontend/rollup.config.js` + widget-canvas tsconfig strict | TS strict, terser prod, sourcemap dev |
| Runtime trigger attach | core `homekit/type_triggers.py:102` | pattern reference |
| Release flow | esl `Makefile:52-171` | single-repo: bump-version + changelog scaffold + manifest==tag CI guard |

## 4. Milestones

**M0 — skeleton + dev env (~½ day)**
- Python 3.14 toolchain; esl Python style (§1.12); root VERSION + Makefile.
- `docker/compose.yaml`: HA `stable` + mosquitto; mount `custom_components/`;
  optional Z2M container.
- manifest, const, empty config flow, hello-world WS command,
  `JSModuleRegistration` + stub card. Verify resource in storage-mode
  Lovelace; README documents YAML-mode manual line.
- ruff + pytest scaffold, CI test job.

**M1 — store + `device_trigger` adapter + dispatcher (core loop)**
- `store.py` schema v1 (design §4) with `async_delay_save`.
- `device_trigger` adapter per §1.4 (Mapping-indexed probe, `None`-detach
  handling, two-layer trigger validation, partial-discovery tolerance).
- Device registry attach; decide diagnostic sensors yes/no.
- Dispatcher skip matrix, validated Script execution, `last_run`/`last_error`.
- Conformance harness: `cv.TRIGGER_SCHEMA` shape pass + full
  `async_validate_trigger_config` (needs registered mock device + mqtt
  loaded in fixtures).

**M2 — WS API + card v0 (auto-grid, YAML tier only)**
- Flat commands: `get_slot`, `save_slot`, `clear_slot`, `save_layout`,
  `probe_device`; every mutation fires `remote_mapper_updated`.
- Card v0: auto-grid from probed layout, tap fires sequence, YAML-tier edit
  modal; `window.customCards` push + `getStubConfig`/`getCardSize`/
  `getGridOptions` day one; bus-event subscribe + refetch.

**M3 — import assistant (§5)**
- `importer.py` + `scan_import`/`apply_import` + card wizard.
- Acceptance: "6gang desktop" (multi-trigger + `choose`) and "Pilot 4x"
  (automation per button) import losslessly; originals disabled; slots fire
  identically.

**M4 — materialization (in-process)**
- `materializer.py` per §1.5: yaml upsert + atomic write + targeted
  `automation.reload {id}` + `asyncio.Lock`.
- Toggle flows: materialize on save; dematerialize draft-then-commit (fetch
  via `raw_config`); orphan 404 → reset + `hass-notification` toast.
- Round-trip test incl. externally edited automation.

**M5 — snapshot + ownership + clear policy**
- `snapshot.py` (scene_api in-process), `owned_scenes`, re-snapshot in place;
  `owned_scene_cleanup` ask/always/never + remember; batch dialog on entry
  removal; unified policy covers materialized-automation deletion.

**M6 — canvas layout + editor tiers 1–2**
- Upstream first: add `src/lib.ts` engine export to widget-canvas, tag a
  release, pin in `frontend/package.json` (§1.13); verify rollup
  tree-shakes/bundles it cleanly.
- Import engine, copy chrome (chipbar/pencil/banner/D-pad); `slot-tile` kind;
  layout via `save_layout`.
- `ha-form` schemas for quick chips + script-reference tier; feature-detect;
  YAML tier always reachable.

**M7 — fallback adapters + polish + release**
- `z2m_mqtt` raw topic; `event_entity` emitting
  `{trigger: "event.received", target: {entity_id}, options: {event_type: [...]}}`
  (2026.7 syntax, feature-detected); `mqtt_generic`.
- Archive drawer, badges, options flow (snapshot_entities via
  entity-multiple selector, policy reset).
- Additive drift-diff: re-probe adds new subtypes, flags removed ones.
- E2E happy paths, HACS release workflow, README.

## 5. Import assistant

Goal: replace existing hand-written automations. Two observed shapes:

**Shape A** — one automation, N device triggers with `id`, single `choose`
keyed on `condition: trigger` → one slot per trigger id, branch `sequence`
verbatim (full SCRIPT_SCHEMA incl. `if/then`, templates, device conditions,
`enabled: false` steps).

**Shape B** — one automation per button, flat `actions` → single slot,
whole list = sequence.

**Mechanics (in-process, no REST):**
- `scan_import {entry_id}`:
  `automation.automations_with_device(hass, device_id)` shortlists entities;
  read each `raw_config`; **normalize both key spellings** (legacy singular
  `trigger:/action:` still occurs in hand-written configs); classify A/B;
  return proposals `{action_id, sequence, source_automation_id (config id),
  source_entity_id, alias, conflicts}`. Keep BOTH ids: `automation.turn_off`
  targets entity_id, deep-link takes config id (map via
  `er.async_get_entity_id("automation", "automation", config_id)`).
  Unclassifiable actions (mixed non-`choose` shapes, branches not keyed on
  trigger id, `default:`) → flagged for manual YAML-tier import, never
  silently dropped. Note: automations without `id:` in config (rare,
  hand-written yaml) lack config id — importable but no deep-link/disable
  mapping; flag them.
- `apply_import`: write slot; **disable** source via `automation.turn_off`
  (entity_id); record `imported_from`; deleting originals stays manual.
- Conflict rule: assigned slot → user chooses. Mixed-remote automations:
  import matching branches only, warn, do NOT disable source.

## 6. Test strategy

- **Unit/integration**: `pytest-homeassistant-custom-component` 0.13.x
  (tracks HA 2026.7, updated daily; **Python ≥ 3.14**). `conftest.py`:
  `enable_custom_integrations`, `MockConfigEntry`, `hass_ws_client`,
  `async_fire_mqtt_message`; device-trigger discovery fixtures + registered
  mock device (required for `async_validate_trigger_config`).
- **Coverage**: design §15 list + importer (A/B lossless, spelling
  normalization, unclassifiable flagging, disable-not-delete, mixed-remote
  warning, missing-config-id flagging) + materializer yaml round-trip
  preserving foreign automations byte-stable where possible.
- **E2E**: Playwright vs docker HA, thin: card load, quick-chip assign, fire
  synthetic event, assert service; snapshot chip; import wizard happy path.
- **CI guard** (esl idea): dev-only env toggles ship correct defaults.

## 7. Design-doc errata (apply to `remote-mapper-design.md`)

1. §6/§12: **"Sent via REST (verified)" is wrong for backend code** — the
   config REST endpoints are admin-authed HTTP views usable by the frontend
   only; integration code edits `automations.yaml`/`scenes.yaml` in-process +
   targeted reload (§1.5). §11's "card never calls /api/config" principle
   survives — the branching just isn't REST.
2. §2 adapter list: `device_trigger` becomes adapter #1 (subsumes
   `zha_event`); raw `z2m_mqtt` demoted to fallback.
3. §6 payload keys: plural `triggers/conditions/actions`.
4. §2 `event_entity` trigger: `event.received` purpose-specific trigger
   (2026.7+), state trigger fallback.
5. New §: import assistant (v1 scope).
6. §13/§15 "existing project conventions" (PHACC/Playwright/docker): none
   exist — greenfield, deliberately chosen.
7. §10/§13 canvas: engine-level lift + chrome, layout server-side.
8. §5 dispatch: validate sequence (`async_validate_actions_config`) before
   `Script` construction.

## 8. Remaining open questions

1. Diagnostic sensor entities in v1 — decide at M1 (device attach alone may
   suffice).
2. Materializer write race vs simultaneous UI edits (view's mutation_lock is
   private) — accepted; revisit only if real-world corruption reports.
3. v2: native `remote_mapper.button` custom trigger (2026.7 integrations can
   contribute editor triggers/conditions). Parked.
4. Bulk "delete imported originals" after confidence period — v1.x.
5. Promote edit chrome (chipbar/pencil/banner/D-pad) into widget-canvas's
   `lib.ts` export once its API settles — removes the last copied frontend
   code; needs the chrome decoupled from `WidgetCanvasCard`'s render/CSS
   first (upstream refactor, low urgency).

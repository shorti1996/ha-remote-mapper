# Remote Mapper — implementation plan (draft v1)

> Companion to `../remote-mapper-design.md` (the design doc). This file plans the
> *build*: milestones, repo layout, dev environment, and what to lift from the
> two internal reference repos. Status: DRAFT — repo-reuse sections pending
> exploration reports; verification notes in `02-verification-notes.md`.

## 0. Ground truth targets

- HA version target: **2026.7.x** (current stable, July 2026). Dev container runs
  `ghcr.io/home-assistant/home-assistant:stable` in docker.
- Python ≥ 3.13 (matches pyproject).
- Distribution: single HACS repo, category **Integration**, card bundled.

## 1. Repo layout

```
ha-remote-mapper/
├── custom_components/remote_mapper/
│   ├── __init__.py            # setup/unload, static path reg, resource reg
│   ├── manifest.json          # domain: remote_mapper; deps: http, frontend, websocket_api, mqtt (after_deps)
│   ├── config_flow.py         # per-remote entry: source pick → adapter sub-form → layout
│   ├── const.py               # DOMAIN, alias/description prefixes, option keys
│   ├── store.py               # Store[RemoteMapperData], schema v1, migrations
│   ├── dispatcher.py          # on_action → slot lookup → Script run
│   ├── materializer.py        # REST wrapper: /api/config/automation|scene
│   ├── snapshot.py            # capture states → persistent scene + ownership reg
│   ├── websocket.py           # WS commands (slot/get|save|archive|clear, snapshot/create, device/probe)
│   ├── adapters/
│   │   ├── __init__.py        # ADAPTERS registry
│   │   ├── base.py            # RemoteSourceAdapter Protocol
│   │   ├── z2m_mqtt.py        # v1 priority 1
│   │   ├── event_entity.py    # v1 priority 2
│   │   ├── zha.py             # v1 priority 3
│   │   └── mqtt_generic.py    # v1 priority 4
│   └── frontend/              # built card JS (dist output, committed or CI-built)
├── src/                       # card TypeScript/Lit source
│   ├── remote-mapper-card.ts
│   ├── canvas/                # lifted/adapted from widget-canvas-ha (TBD after exploration)
│   ├── editor/                # slot editor modal, 3 tiers
│   └── ha-components.ts       # embedded HA component loader (from widget-canvas-ha)
├── tests/                     # pytest-homeassistant-custom-component
├── e2e/                       # Playwright vs dockerized HA
├── docker/                    # dev HA: docker-compose.yml, config/
├── hacs.json
└── pyproject.toml
```

## 2. Milestones

**M0 — skeleton + dev env (½ day)**
- docker-compose with HA `stable`, mounted `custom_components/`, MQTT broker
  (mosquitto) for adapter testing without real Zigbee.
- manifest, empty config flow, hello-world WS command, static path + Lovelace
  resource auto-registration (storage mode; log warning + docs note for YAML mode).
- CI: ruff + pytest scaffold.

**M1 — store + dispatcher + one adapter (core loop)**
- `store.py` schema v1 exactly as design §4.
- `z2m_mqtt` adapter: subscribe, on_action, `build_trigger`.
- Dispatcher: slot lookup, skip rules (empty/archived/materialized), `Script`
  helper execution with `Context`, `last_run`/`last_error` bookkeeping.
- Tests: dispatch matrix, adapter conformance harness (parametrized, reused by
  later adapters).

**M2 — WS API + minimal card (assign via YAML tier)**
- WS commands: `slot/get`, `slot/save`, `slot/clear` (no scene policy yet).
- Card v0: auto-grid layout (fallback path from design §10), slot tiles, tap
  fires sequence, edit modal with **YAML tier only** — proves the full loop
  before any canvas/embedded-component risk.

**M3 — materialization**
- `materializer.py` REST wrapper. NOTE (verified): payload must use **plural
  keys** `triggers:`/`conditions:`/`actions:` (HA ≥ 2024.10 style; the native
  editor writes these). Design doc §6 shows singular — update it.
- Toggle flow: draft-then-commit dematerialize, orphan detection at load.
- Round-trip tests (design §15).

**M4 — snapshot-to-scene + ownership registry**
- `snapshot.py`: capture → `POST /api/config/scene/config/{id}` → owned_scenes.
- Clear flow with `owned_scene_cleanup` policy (ask/always/never + remember).
- Re-snapshot in place.

**M5 — canvas layout + quick chips + embedded components**
- Lift canvas from widget-canvas-ha (details TBD from exploration).
- Slot editor tiers 1–2 (quick chips, script reference) using the embedded HA
  component loader; feature-detect, YAML tier fallback.

**M6 — remaining adapters + polish**
- `event_entity` (NOTE verified: 2026.7 has purpose-specific event-entity
  triggers — prefer over state-on-attribute; Z2M event entities still
  experimental/opt-in), `zha`, `mqtt_generic`.
- Archive drawer, badges (broken binding, stale mapping, last-error).
- Options flow: snapshot_entities, cleanup policy reset.
- E2E suite, HACS release workflow.

## 3. Reuse from reference repos

### widget-canvas-ha (canvas + embedded HA components) — EXPLORED

Repo: `/home/shared/repos/widget-canvas-ha` (~4.9k LOC TS, Lit 3, Rollup,
strict TS; patterns inherited from Drag-And-Drop-Card).

**Canvas: no standalone `<widget-canvas>` element.** Rendering (DOM + CSS) is
baked into `WidgetCanvasCard.render()` (`src/widget-canvas-card.ts:781–898`,
styles 455–779). What IS liftable as a near-standalone engine:

| Piece | File | Why |
|---|---|---|
| `EditController` + `EditHost` interface | `src/editor/edit-controller.ts` (host iface lines 8–21) | drag/resize/z/nudge/undo/long-press engine; talks to host only via 8-method interface — implement `EditHost` on remote-mapper card |
| `EditSession` registry | `src/editor/session.ts` | edit survives card element recreation on HA view rebuild |
| `computeTransform` scaling | `src/render/scaling.ts:25` | canvas-units → CSS scale; contain-fit |
| Z-order pure fns | `src/model/zorder.ts` | applyZOp/normalizeZ |
| Snap helpers, `normalizeConfig` | `src/model/migrate.ts` | idempotent config normalization, schema_version dispatch |

Children: hardcoded `switch(w.kind)` (4 kinds) — no generic slot. For
remote-mapper: **extend the switch with a `slot-tile` kind** in our fork of the
render layer (we re-implement render anyway). Layout persists in **card config**
via `canvas_id`-keyed self-save (`src/persistence/layout-store.ts:83`,
config-tree patching `src/persistence/config-tree.ts`, localStorage fallback
overlay). Remote-mapper alternative: persist layout server-side in our Store via
WS (we have a backend — simpler than the self-save machinery; decide in
refinement).

**Embedded HA components — copy nearly verbatim:**
- `src/editor/ha-loader.ts` (69 lines): `ensureHaForm()` — instantiate a
  built-in card's config editor via `loadCardHelpers().createCardElement()` to
  force-load the chunk defining `ha-form` + all selectors; race
  `customElements.whenDefined` vs 2s timeout; failures not cached (retry).
  `ensureYamlEditor()` — same trick via `conditional` card editor →
  `ha-yaml-editor`.
- `src/util/actions.ts:10` — memoized `loadCardHelpers()` wrapper.
- `src/widgets/card-embed.ts` — `hui-card` element (preferred) /
  `createCardElement` fallback, if we ever embed whole cards.

**Crucial nuance:** entity/icon/action pickers are NOT standalone elements —
obtained **indirectly via `ha-form` + selector schemas**: `{entity: {}}`,
`{icon: {}}`, `{ui_action: {}}` (action+service+target picker), `{text}`,
`{select}`, etc. (`src/editor/widget-settings.ts:42–147`). Slot editor tiers
1–2 should be `ha-form` schemas, not hand-assembled pickers. YAML tier =
`ha-yaml-editor` with `<textarea>` JSON fallback (pattern at
`widget-settings.ts:350–376`).

**Version handling:** zero numeric HA-version gating — all element-presence
detection (`customElements.get/whenDefined` + timeouts). Min HA in hacs.json.
Mirror this.

**Build to mirror:** Rollup + terser, single entry → one dist JS, Lit as only
runtime dep, hand-rolled minimal HA types (no `custom-card-helpers`).

### zhsunyco-esl (integration conventions) — EXPLORED

Monorepo, two integrations: `eink_display_manager` (edm — WS API, bundled card,
coordinator) + `wolink_esl` (per-device config flow). Best hybrid template:
wolink per-device flow + edm WS/frontend machinery.

**Copy list:**

| Concern | Source |
|---|---|
| Per-device config flow, `async_set_unique_id` + `_abort_if_unique_id_configured` | `wolink_esl/config_flow.py:40-218` |
| `async_setup()` once (WS+services+frontend, deferred to `EVENT_HOMEASSISTANT_STARTED`) vs `async_setup_entry()` per device | `eink_display_manager/__init__.py:114-135, 293-400` |
| WS command structure (`websocket_command` + `async_response`, explicit registration) | `eink_display_manager/__init__.py:499-892` |
| **`JSModuleRegistration`** — static paths + Lovelace resource auto-reg + `?v=` cache-bust; `LOVELACE_DATA`, `.resource_mode == "storage"` guard, `/hacsfiles/<domain>` URL_BASE | `eink_display_manager/frontend/__init__.py` + `const.py:9-21` |
| Rollup/Lit/TS build, committed `www/` output, `window.customCards` self-reg | `frontend/rollup.config.js`, `frontend/src/eink-editor-card.ts:1981-1984` |
| Config-entry migration example | `eink_display_manager/__init__.py:138-264` |
| strings.json/translations shape | `eink_display_manager/strings.json` |
| Version bump + changelog + publish CI shape | `Makefile:71-172`, `.github/workflows/publish.yml` |
| How-to writeups | `eink_display_manager/CLAUDE.md`; `ai/021-embed-lovelace-card/*.md` (guide + post-review corrections) |

**Watch-outs / deviations:**
- esl does NOT use `helpers.storage.Store` (manual JSON in `.storage/<domain>/`,
  executor-wrapped). Remote-mapper introduces Store fresh (design doc wants it;
  verified public/stable) — but lift esl's hot/cold split + orphan cleanup ideas.
- esl tests = hand-rolled HA stubs (`tests/ha_stubs.py`), no
  pytest-homeassistant-custom-component, no Playwright, no HA docker dev env.
  All greenfield for remote-mapper.
- No ruff/mypy/pre-commit in esl — greenfield too.
- Don't set `OptionsFlow.config_entry` manually (breaks HA 2025.12+).
- Min HA ≥ 2025.7 (async_register_static_paths sync API removed).

## 4. Dev environment (docker, latest HA)

```yaml
# docker/docker-compose.yml (sketch)
services:
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable   # 2026.7.x
    volumes:
      - ./config:/config
      - ../custom_components/remote_mapper:/config/custom_components/remote_mapper
    ports: ["8123:8123"]
  mosquitto:
    image: eclipse-mosquitto:2
    ports: ["1883:1883"]
```

- Synthetic remote: `mosquitto_pub -t zigbee2mqtt/test_remote -m '{"action":"1_short"}'`
  exercises the full loop without hardware.
- Card dev: vite/rollup watch → dist mounted into `frontend/`.

## 5. Open questions (to resolve in refinement)

1. Canvas: import as component vs. fork the layout engine? Depends on coupling
   (exploration pending).
2. Automation config REST: confirmed semi-official (UI uses it, undocumented).
   Keep thin wrapper + integration test against dockerized HA per release.
3. 2026.7 lets integrations contribute **custom triggers/conditions** — could
   remote-mapper expose a native `remote_mapper.button_pressed` trigger as a
   bonus surface? Out of v1 scope; note for v2.
4. Lovelace resource auto-registration: storage mode only (verified). YAML-mode
   users need manual resource line — document it.
5. Config entry migration (`async_migrate_entry`) is for *entry* data; slot
   store versioning is separate (Store's own migration hook). Keep both.

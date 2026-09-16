# Grid layout picker + display modes — plan (v1)

> Input: user sketch (2026-09-15), screenshots of the current card, the five
> physical remotes (MOES 4-button bar, 6-gang 2×3, 4-button 2×2, round
> 1-button, 1-button puck). Builds on `03-implementation-plan.md` (M6 canvas).
> Target HA: 2026.7.x (dev env pinned to `stable`).

## 0. Problem

The canvas shows **one tile per action id** (`1_single`, `1_double`, …). A
6-gang remote with single/double/hold is 18 tiles the user has to drag into
place, and the tile ≠ physical button, so the card never looks like the
remote. Three things are missing:

1. **Button** as a first-class unit (a physical key with N events).
2. A fast way to say "this remote is 2×3" — MS-Word table picker.
3. A choice of how much to show per button (compact vs. everything).

## 1. Decisions (locked unless verification says otherwise)

1. **Buttons are derived server-side** (`buttons.py`, pure functions,
   pytest-covered) from the action id list + adapter id. The card never
   parses ids. `get_remote` gains `buttons: [{id, label, actions:
   [{action_id, event, kind}]}]`.
   - `matter`: `token:event` → button `token`. Already namespaced.
   - `event_entity`: single entity = single button; every action is an event
     of button `"button"`.
   - `device_trigger` / `z2m_mqtt` / `mqtt_generic` (Z2M vocabulary): split
     at the last `_`-suffix that is a known event token, 2-token suffix tried
     first (`arrow_left_click` → `arrow_left`/`click`,
     `brightness_up_hold` → `brightness_up`/`hold`, `1_single` → `1`/`single`).
     No known suffix → whole id is the button, event `press`.
   - `kind` ∈ `single | double | triple | hold | release | other`, e.g.
     `single|click|press|short|short_press|multi_press_1` → single;
     `double|double_press|multi_press_2` → double; `hold|long|long_press` →
     hold; `release|long_release|hold_release` → release. Drives gesture
     mapping and icons (1 / 2 / 3 / ⧗ / ↥ / •).
   - Button order: natural sort (`1,2,…,10`), so lazy Z2M discovery order
     (`2,1,4,6,5,3` in the screenshot) does not leak into the grid.
   - Regrouping overrides are **out of scope** for v1 (heuristic misses stay
     visible as extra buttons; nothing is hidden).
2. **Grid layout is per remote, stored server-side** next to `card_layout`:
   ```json
   "grid_layout": {
     "schema_version": 1, "rows": 3, "cols": 2,
     "buttons": { "1": {"row": 0, "col": 0, "label": "Top left"},
                  "2": {"row": 0, "col": 1} }
   }
   ```
   Only position + optional label override are stored; grouping stays
   derived, so a newly discovered `1_triple` lands on button `1` without a
   layout change. Buttons missing from the stored map (new since save) are
   appended to extra rows by the card (same policy as the canvas today).
   Validated in `save_layout` (rows/cols 1..12, buttons dict of ints).
3. **Display mode is per card instance** (dashboard config), because the same
   remote can be compact on a phone and exploded on a wall tablet:
   ```yaml
   type: custom:remote-mapper-card
   entry_id: …            # optional with one remote
   layout: grid           # grid (default) | canvas (legacy free-drag)
   display: assisted      # assisted (default) | replica | all   (replica was "normal" pre-release)
   ```
   A real **card config editor** (`getConfigElement`, `ha-form`) with a
   remote picker (from `list_remotes`) replaces "paste the entry_id".
4. **Display modes** (view mode, `layout: grid`):
   - `replica` (was `normal`) — cell = physical button. Dashboard gestures map to events:
     tap → `single`, double-tap → `double`, triple → `triple`, hold →
     `hold` (then `release` on lift if the button has one). The double-tap
     wait (~280 ms) only applies when the button actually has a double/triple
     action, so single-only buttons stay snappy. This is a **deliberate
     reversal** of the design-doc §10 "gesture namespace boundary" for this
     mode only — the mode's whole point is "works like the physical remote".
     Cell shows label + kind dots (● ●● ⧗) for assigned events.
   - `all` — cell = button header + one chip per event (icon + summary);
     tap a chip → run it. Nothing hidden ("full in-view").
   - `assisted` — cell shows label + primary summary; press → popover fans
     out the button's events as circles (Pinterest style: release over a
     circle selects; or tap one). Tap outside closes.
5. **Edit mode** (pencil) for the grid: header gets ⊞ **Layout** (grid picker),
   ⇪ Import, ✕ Cancel, ✓ Done. Working copy of `grid_layout` in the card;
   saved on ✓ via `save_layout`, dropped on ✕ (same contract as the canvas).
   - Drag a button onto another cell → swap (pointer events +
     `elementFromPoint`, works on touch).
   - Tap a button → **button sheet**: label field + event rows (icon, event,
     summary, ▶ run, ✎ edit) → ✎ opens the existing slot editor modal
     unchanged. In `all` display, tapping a chip opens the editor directly.
   - Slot saves keep saving immediately (unchanged); only geometry/labels
     are draft-then-commit.
6. **Grid picker** = MS-Word table picker: matrix of small cells, hover
   highlights `r×c`, caption "3 × 2", click applies. Visible size grows from
   5×5 as the pointer nears the edge (max 10×10). Picking fewer cells than
   buttons clamps `rows = ceil(N/cols)` and says so. Re-flow after a pick:
   buttons keep their cell if still in range, the rest fill free cells in
   reading order.
7. **Legacy canvas stays** behind `layout: canvas`; its code path is not
   touched. `display` is ignored there (canvas is inherently "all").
8. **Auto grid** when no `grid_layout` saved: N≤6 → 2 columns, rows =
   ceil(N/2) (matches 2×2 / 2×3 remotes); N=1 → 1×1; N>6 → cols =
   ceil(√N). Users fix odd ones (4-button bar = 1×4) with the picker.

## 2. Files

Backend (`custom_components/remote_mapper/`):
- `buttons.py` — NEW: `group_buttons(source, action_ids)`, `event_kind()`,
  `parse_z2m_action()`, natural sort key.
- `websocket.py` — `get_remote` returns `buttons` + `grid_layout`;
  `save_layout` accepts `card_layout` and/or `grid_layout`
  (`cv.has_at_least_one_key`), grid schema validated with vol.
- `store.py` — `async_ensure_remote` default gains `grid_layout: None`
  (readers use `.get`, old records fine — no store version bump).

Frontend (`frontend/src/`):
- `model.ts` — NEW: `ButtonModel`, `GridLayout`, `buildGrid()` (stored
  layout + buttons → cells, appends unplaced), `autoGrid()`, `reflow()`,
  `KIND_ICON`.
- `gestures.ts` — NEW: `TapRecognizer` (single/double/triple/hold/release
  with capability-aware waits).
- `grid-picker.ts` — NEW: `<remote-mapper-grid-picker>` (Word-style).
- `remote-grid.ts` — NEW: `<remote-mapper-grid>` — renders cells for all
  three display modes, edit-mode swap-drag, assisted popover. Emits
  `run-action {actionId}`, `edit-action {actionId}`, `open-button
  {buttonId}`, `layout-changed {layout}`. No WS calls inside.
- `card-editor.ts` — NEW: `<remote-mapper-card-editor>` (`ha-form`:
  remote, layout, display) + `config-changed`.
- `remote-mapper-card.ts` — `layout`/`display` config, `getConfigElement`,
  grid branch in `render()`, button sheet modal, edit-mode header for grid,
  `saveWorking` for grid layout. Canvas branch untouched.

Tests:
- `tests/test_buttons.py` — NEW: Z2M 6-gang, IKEA Styrbar vocab, Matter
  tokens, event-entity single button, unknown ids, natural order, kinds.
- `tests/test_websocket.py` — `get_remote` exposes `buttons`; `save_layout`
  grid round-trip; invalid grid rejected; `card_layout`-only still works.

## 3. Steps

1. `buttons.py` + `tests/test_buttons.py` (pure, fast).
2. WS: `get_remote` buttons/grid_layout, `save_layout` grid + tests.
3. `model.ts` + `gestures.ts` (no DOM deps beyond pointer events).
4. `grid-picker.ts`, `remote-grid.ts` (three display modes + edit swap).
5. `card-editor.ts` + card wiring (`layout`/`display`, header, button sheet).
6. `make dev` → type-check + bundle; `make test`; smoke in dev HA
   (`make ha-up`, hard-reload the dashboard, `?v=` cache-bust if needed).
7. `make build` (production bundle committed in `www/`), README section.

## 4. Verification targets (context7, before step 3)

- Custom card **config editor** contract: `static getConfigElement()`,
  `setConfig` on the editor, `config-changed` event `{detail: {config}}`,
  `getStubConfig` — unchanged in 2026.x?
- Sections-view sizing: `getGridOptions()` (already used) still the API;
  `getCardSize` fallback.
- `ha-form` select selector (`{select: {mode: "dropdown", options:
  [{value,label}]}}`) + `computeLabel` — still current.
- Anything new for custom cards in 2026 (card features / `hui` element
  renames) that would break `window.customCards` registration.

Backend touches no new HA API (voluptuous + existing WS decorators) — no
verification needed beyond the test suite.

### 4.1 Results (context7, 2026-09-15)

| Claim | Verdict | Source |
|---|---|---|
| `static getConfigElement()` returns an editor element; editor gets `setConfig(config)`, `hass`, `lovelace`; emits `config-changed` (`bubbles: true, composed: true`, `detail: {config}`) | ✅ current | developers.home-assistant.io/docs/frontend/custom-ui/custom-card |
| `getStubConfig()` seeds the card picker | ✅ current | same |
| `getGridOptions()` → `{rows, min_rows, max_rows, columns, min_columns, max_columns}`; columns in multiples of 3 recommended (card uses 12 / min 6 — fine) | ✅ current | same |
| `getCardSize()` masonry only, 1 unit = 50 px | ✅ current | same |
| `ha-form` `select` selector `{mode: "dropdown", options: [{value,label}]}` + `computeLabel` | ✅ proven live — the quick tab already renders it in the 2026.7 dev HA (screenshot 2) | in-repo |
| `window.customCards` registration (`type,name,description,preview`, optional `documentationURL`) | ✅ current | same page |

No drift → implement as planned. Backend needs no new HA API.

## 5. Out of scope / follow-ups

- Regrouping overrides (assign an action to another button) — needs UI +
  `grid_layout.buttons[id].actions`; wait for a real misparse.
- Per-model SVG faceplates — the grid covers all five owned remotes.
- Moving the canvas engine to the npm git dependency (plan v5 §1.13) —
  unrelated, still pending.
- Card feature/`hui-card-features` integration — not needed.

## 6. Status (2026-09-15)

Steps 1–5 and 7 done: `buttons.py` (+9 tests), WS `buttons`/`grid_layout`
(+2 tests), `model.ts`, `gestures.ts`, `grid-picker.ts`, `remote-grid.ts`,
`card-editor.ts`, card wiring, production bundle in `www/`, README.
73/73 pytest, ruff clean, `tsc --noEmit` clean.

Step 6 (smoke in dev HA) pending: the dev HA is stopped mid-move (see the
`ha-config` sudo step); run `make ha-up`, hard-reload, add the card, check
all three display modes + the picker on a phone-width viewport.

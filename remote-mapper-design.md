# Remote Mapper — design doc

Custom HACS integration + bundled Lovelace card that turns physical remotes
(Zigbee/MQTT/etc.) into first-class dashboard objects: each remote gets a card
visually representing its buttons; each button × event ("slot") can be assigned
an action, executed by the integration or optionally materialized as a native
HA automation. Includes one-tap snapshot-to-scene ("save current room state
onto this button").

Status: design complete, verified against HA internals (July 2026). Ready for
implementation. Companion input: the in-house Widget Canvas card repo (see
§ Prior art, internal).

---

## 1. Architecture

Three layers:

1. **Adapters** — pluggable source-specific code: (a) subscribe to a remote's
   events at runtime, (b) enumerate available actions, (c) generate an
   automation trigger for materialization.
2. **Slot store** — per-remote mapping state in `helpers.storage.Store`.
   Single source of truth for non-materialized slots; thin pointer record for
   materialized ones.
3. **Card** — Lit custom card rendering the remote layout, slot states, and
   the slot editor. Bundled with the integration (served from the
   integration's static path, resource auto-registered) — the card is useless
   without the integration's WS API, and bundling eliminates version skew.

Distribution: single HACS repo, "Integration" category. Standard
`manifest.json`, config flow per remote, `pytest-homeassistant-custom-component`
for tests.

## 2. Adapter contract

```python
class RemoteSourceAdapter(Protocol):
    id: str                      # "z2m_mqtt" | "event_entity" | "zha_event" | "mqtt_generic"
    label: str
    config_schema: vol.Schema    # per-source config sub-form

    async def subscribe(
        self, hass: HomeAssistant, config: dict,
        on_action: Callable[[str, dict], None],
    ) -> CALLBACK_TYPE: ...      # returns unsubscribe for entry unload

    def build_trigger(self, action_id: str, config: dict) -> dict: ...
        # returns a cv.TRIGGER_SCHEMA-valid trigger dict

    async def default_actions(
        self, hass: HomeAssistant, config: dict,
    ) -> list[str]: ...          # best-effort; empty list valid
```

Registered in module-level `ADAPTERS: dict[str, type[RemoteSourceAdapter]]`.
The materializer, dispatcher, card, and store never branch on source type —
adding a protocol (Matter/BTHome/…) is one new adapter file, zero changes
elsewhere. Each adapter owns both the runtime subscription and the static
trigger payload (symmetry: `subscribe()` ↔ `build_trigger()`).

v1 adapters, in priority order:

1. **Z2M MQTT topic** — subscribe `zigbee2mqtt/{name}`, extract `action`
   field. Works without HA discovery. Trigger: `{platform: mqtt, topic,
   value_template: "{{ value_json.action }}", payload: action_id}`.
2. **`event.*_action` entity** — modern Z2M/HA path. `default_actions` reads
   the `event_types` attribute. Trigger: state-on-attribute. NOTE: still
   experimental in Z2M (opt-in `homeassistant.experimental_event_entities`),
   naming actively evolving — see § Drift.
3. **`zha_event`** — filter by `device_ieee`. Trigger: event platform.
4. **Generic MQTT** — arbitrary topic + template to extract `action_id`.
   Escape hatch for deCONZ, ESPHome, custom firmware.

Card config flow: pick source → adapter renders its config sub-form →
`default_actions()` suggests action ids → user accepts, edits, or replaces
with their own naming (e.g. `1_short`, `1_hold`). Action ids are opaque
strings to everything downstream.

## 3. Slot model & lifecycle

Slots are **not created or deleted**. A remote's slot set is fixed by hardware
definition (e.g. 4 buttons × {single, double, hold} = 12), instantiated at
config entry setup. Slots only change state:

| State | Store record | Dispatcher | Card |
|---|---|---|---|
| **Empty** | absent (no key for `action_id`) | no-op | unassigned button |
| **Assigned** | present | executes | shows binding |
| **Archived** | present, `archived: true` | skipped | archive drawer |

- **Archive** = soft-disable, all record data retained. For materialized
  slots, archiving calls `automation.turn_off` on the generated automation
  (disable, not delete); unarchiving calls `automation.turn_on`.
- **Unarchive** = flip the flag; optionally reassign to a different
  `action_id` (a Store key move — referenced scene/sequence untouched).
- **Clear** = remove the record → Empty. No slot residue exists by design;
  the only cleanup question is the owned scene (§ 7).
- **Reorder** between buttons = Store key swap. Scenes are never recreated or
  renamed by a reorder.

## 4. Storage schema

`Store[dict[str, Any]]`, schema-versioned, migrations in
`async_migrate_entry`.

```json
{
  "version": 1,
  "data": {
    "remotes": {
      "<remote_entry_id>": {
        "source": "z2m_mqtt",
        "source_config": {"topic": "zigbee2mqtt/bedroom_remote"},
        "layout": {"buttons": 4, "events": ["single", "double", "hold"]},
        "snapshot_entities": ["light.sypialnia", "light.wled_sypialnia"],
        "slots": {
          "1_short": {
            "sequence": [],
            "scene_id": null,
            "materialized": false,
            "automation_id": null,
            "archived": false,
            "schema_version": 1,
            "updated_at": "<iso8601>"
          }
        }
      }
    },
    "owned_scenes": {
      "<scene unique_id>": {
        "created_for": "<remote_entry_id>/<action_id>",
        "created_at": "<iso8601>",
        "entities": ["light.sypialnia", "light.wled_sypialnia"]
      }
    }
  }
}
```

Field semantics:

- `sequence` — list of actions, `cv.SCRIPT_SCHEMA`-valid; the same structure
  as `script.X.sequence` / automation `actions:` (supports `choose`,
  `parallel`, `repeat`, `if/then`, `wait_for_trigger`, templates — no
  restrictions vs. native automations).
- `scene_id` — set when the slot's sequence is the canonical
  single-`scene.turn_on` form created via the snapshot flow; arbitrary
  sequences keep `null` and are exempt from scene-cleanup logic.
- `materialized` / `automation_id` — § 6.
- `schema_version` — per-slot, for action-name drift handling (§ 10).
- `owned_scenes` — scenes created *by this integration* only; the ownership
  registry (§ 7). `entities` records the snapshot set for in-place
  re-snapshot.
- `snapshot_entities` (per remote) — default entity set for the snapshot
  flow (§ 8).

Config entry options: `owned_scene_cleanup`: `ask` (default) |
`always_delete` | `never_delete` (§ 7).

## 5. Dispatch (non-materialized path)

On entry setup: load store, instantiate adapter, `subscribe()`. The
`on_action(action_id, raw_event)` callback:

1. Look up slot; absent → no-op.
2. `archived: true` or `materialized: true` → skip (materialized slots are
   handled by their automation via the parallel trigger; this is what makes
   "edit natively in HA" real).
3. Execute via the Script helper:

```python
from homeassistant.helpers.script import Script
script_obj = Script(hass, slot["sequence"],
                    f"{device_name} {action_id}", DOMAIN)
await script_obj.async_run(context=Context(...))
```

No per-mapping automation entities, no script entities, no registry entries —
one listener per remote, sequences as data. Pass `Context` so logbook
attribution works. Store `last_run`/`last_error` per slot and surface in the
card (ad-hoc `Script` runs have no native trace UI — accepted trade-off; the
materialize toggle is the path to full tracing).

Dispatcher must never throw on a dangling scene pointer (§ 9).

## 6. Materialization

Toggle per slot: "create automation". Mental model: **mode switch, not
one-shot export**. On = the slot lives in HA's automation system (editable
everywhere, traceable, findable by `search/related`). Off = lives in the
Store, card-only, lighter.

**Materialize (toggle on, commit on modal save — never live while editing):**

```python
payload = {
  "alias": f"[{DOMAIN}] {device_name} · {action_id}",
  "description": (f"Auto-managed by {DOMAIN}. Edits here are canonical. "
                  f"Disable the toggle in the remote card to remove."),
  "trigger": adapter.build_trigger(action_id, source_config),
  "condition": [],
  "action": slot["sequence"],
  "mode": "single",
}
```

Sent via **REST** (verified — this is what the native editor uses; there is
no WS command for automation config):

- Create/update: `POST /api/config/automation/config/{id}` (generate the id;
  it becomes the automation's `attributes.id`)
- Delete: `DELETE /api/config/automation/config/{id}`
- Follow writes with the `automation.reload` service if needed (the endpoint
  triggers reload itself in current HA; verify at implementation).

Same pattern for scenes: `/api/config/scene/config/{id}`.

Store `automation_id`, set `materialized: true`. Keep `alias`/`description`
prefixes in a constants module — orphan detection is a substring check.

**While materialized:** the card does NOT maintain a copy of the sequence. The
slot renders a summary line ("Linked to: automation.X") + an "Edit in HA"
deep-link to `/config/automation/edit/{automation_id}` (verified current
route). The automation is canonical; the integration's listener skips the
slot.

**Dematerialize (draft-then-commit):** unticking the toggle fetches the
automation's current `action:` into the modal's *local state only* and shows:
"On save, automation X will be deleted and its actions will live in this card
instead. Cancel to keep things as they are." Nothing is written until Save;
Cancel is a true no-op. On Save: write sequence to Store, set
`materialized: false`, delete the automation **subject to the
`owned_scene_cleanup` policy** (§ 7) — `never_delete` leaves it in place but
disabled, pointer dropped.

**Orphan handling:** stored `automation_id` that 404s at load → reset
`materialized: false`, one-time toast in the card.

## 7. Scene ownership registry & clear flow

Persistent scenes live in HA's scene storage, not the slot store — slots hold
pointers. Scenes can't carry custom metadata, so the integration keeps
`owned_scenes` (§ 4). A scene enters the map **only** when created by this
integration (snapshot flow). Hand-made scenes assigned to slots are never
deleted, prompted about, or touched.

**Clearing a slot (or overwriting its assignment) whose scene is owned:**

1. Check `owned_scene_cleanup`: `ask` | `always_delete` | `never_delete`.
2. `ask` → dialog **"Also delete scene X?"** with a "remember my choice"
   checkbox; checking persists as `always_delete`/`never_delete`. Resettable
   to `ask` in the options flow.
3. Delete path: `DELETE /api/config/scene/config/{id}` + drop registry entry.
   Keep path: registry entry dropped — the scene becomes indistinguishable
   from hand-made (intentional; no orphan tracking).
4. Scene not owned → no dialog, pointer removed, done.

**Unified policy:** the generated automation of a materialized slot is
integration-owned by definition, so clearing a materialized slot deletes its
automation under the **same** remembered choice — no separate dialog. This
supersedes any per-instance "keep or delete?" prompt for dematerialization.

**Bulk:** removing a remote's config entry clears all slots; if `ask`, show
**one** dialog for the batch listing affected scenes/automations.

## 8. Snapshot-to-persistent-scene flow

The core convenience feature: *set the room how you like it, press save on
the card, the state becomes a scene bound to a button.* Manual scene
authoring (enumerating entities/attributes in the editor) is explicitly out —
that workload is the reason this feature exists.

Mechanics: capture current state of the entity set and write a **persistent**
scene via `POST /api/config/scene/config/{id}` (dynamic `scene.create`
snapshots die on restart — unusable for a managed library). Register in
`owned_scenes` with the entity list; write the slot sequence as the canonical
`[{action: scene.turn_on, target: {entity_id: X}}]` with `scene_id` set.

**Entity selection** (the "which entities to snapshot" problem):

1. **Per-remote default set** — `snapshot_entities` in the remote's options,
   configured once ("this remote controls: …"). The snapshot chip uses it
   with no further questions. One tap. Matches how remotes are actually used.
2. **Editable per snapshot** — the snapshot dialog pre-fills the default set
   in an entity picker; edit to deviate this once. The final list is stored
   in the owned scene's `entities`.

**Re-snapshot updates in place:** hold an assigned slot in edit mode →
"re-snapshot" → same entity set (from `owned_scenes[id].entities`), same
scene id, new states. The preset evolves without accumulating versioned
clutter (`scene.kuchnia_darkk2`-style) and without creating orphans.

## 9. Failure / drift handling

- **Dangling pointer** (slot → deleted scene, manual delete or `scenes.yaml`
  edit): detected at load (`states()` unknown) and at dispatch (no-op, never
  throw). Card shows a broken-binding badge; actions: reassign or clear.
- **Registry entry with no scene**: prune at load.
- **Z2M action-name drift** (naming still being reworked upstream): on
  adapter startup, diff the device's current action set against stored slot
  keys; mismatches surface as "stale mapping" badges (same UI surface as
  broken bindings, different cause). `schema_version` per slot supports a
  future remap-on-upgrade assistant.
- No background reconciliation loop; checks run at entry setup and lazily at
  dispatch/card render.

## 10. Card UX

**Layout**: user-arranged canvas (see § Prior art, internal) — the user drags
slot tiles into an arrangement mirroring the physical device, once, in edit
mode. Replaces the earlier plan of auto-layout grids (v1) + per-model SVGs
(v2): handles any device, no SVG treadmill. Fallback if canvas reuse slips:
auto grid from button count (4 → 2×2, 5 → IKEA cross).

**View mode**: each slot tile shows the binding summary (target
friendly_name + icon; sub-rows per event type). Empty slots dimmed. Archived
slots in a collapsible drawer. Badges: broken binding, stale mapping,
last-error. **Tapping a sub-row fires the bound sequence** — test the mapping
from the couch. (Namespace note below.)

**Edit mode** (gear): tiles become tappable → slot editor modal with three
tiers, all writing the same `sequence`:

1. **Quick chips** — "Activate scene" (entity picker filtered to `scene.*`),
   "Toggle entity", "Run script", **"Snapshot current state → new scene"**
   (§ 8). One-item sequences under the hood. Covers ~80 % of real mappings.
2. **Script reference** — pick an existing `script.X`; the escape hatch for
   reusable logic that should be a first-class entity.
3. **Advanced** — YAML editor for the raw sequence, validated server-side
   with `cv.SCRIPT_SCHEMA` before persisting.

Embedded HA editor components (entity picker, service control, icon picker)
are used where available via the loading mechanism proven in the Widget
Canvas repo; the YAML tier is the guaranteed fallback if a frontend refactor
breaks component embedding. The **materialize toggle is the blessed path to
the full native action editor** — users wanting `choose`/conditions UI flip
it and get HA's own editor via the deep-link.

**Gesture namespace boundary** (important): canvas widget
`tap/hold/double_tap` are *dashboard* gestures (finger on glass). Slot events
(`1_short`, `1_hold`) are *physical remote* events. A slot tile's on-screen
tap fires the bound sequence; it must not be conflated with the physical
event binding in UI copy or config schema. Keep the two vocabularies visibly
distinct.

## 11. WS command surface (integration ↔ card)

- `{DOMAIN}/slot/get` — merged view: stored sequence, OR live-fetched
  automation summary if materialized.
- `{DOMAIN}/slot/save` — write slot; performs materialize/dematerialize
  based on toggle delta; runs the clear-flow policy when overwriting an
  owned-scene assignment.
- `{DOMAIN}/slot/archive`, `{DOMAIN}/slot/clear` — lifecycle transitions
  (clear applies § 7).
- `{DOMAIN}/snapshot/create` — snapshot flow; args: remote, action_id,
  entity list (defaults applied server-side), name; `re_snapshot: true`
  reuses the existing owned scene id.
- `{DOMAIN}/device/probe` — `adapter.default_actions()` for the edit-mode
  slot grid.

The card never calls `/api/config/...` directly — all REST branching lives
in the integration, one wrapper module per endpoint family (single place to
patch if the semi-official config API shifts).

## 12. Verified API surface (research corrections baked in)

| API | Status | Notes |
|---|---|---|
| `Script(hass, sequence, name, domain)` + `async_run(context=)` | ✅ public, stable | Verified against dev branch |
| `helpers.storage.Store[T]` | ✅ public, stable | Generic since 2022.8 |
| `async_track_state_change_event`, MQTT `async_subscribe`, `zha_event` | ✅ public | |
| `cv.SCRIPT_SCHEMA`, `cv.TRIGGER_SCHEMA`, `async_validate_action_config` | ✅ public | Validate before persisting |
| Automation/scene config CRUD | ⚠️ semi-official **REST** (`/api/config/{automation\|scene}/config/{id}`) — NOT WebSocket | Stable since ~2019; same endpoints the native editors use; wrap thin |
| `/config/automation/edit/{id}` deep-link | ✅ current | |
| Embedded HA frontend components in custom cards | ⚠️ riskiest dependency | No official import path; loading workarounds required. Mitigated: Widget Canvas repo demonstrates a working mechanism; YAML tier is the fallback |
| Z2M `event.*_action` + `event_types` | ⚠️ experimental upstream | Opt-in flag; naming evolving; adapter #1 (raw MQTT) is the robust default |

## 13. Prior art

**Internal — Widget Canvas card** (repo available locally; read before
implementing the card layer):

- Free-position widget canvas inside a normal dashboard grid slot. Widgets
  carry `{id, x, y, z, w, h, icon, label, tap_action, style}`; layout
  persists in card config (portable, no backend). On-canvas editing
  (long-press/pencil → move, resize, per-widget dialog with
  undo/revert/done). Config schema is LLM-friendly (README).
- **Reuse 1 — canvas as the remote layout engine** (§ 10). Verify: how
  self-contained the canvas component is, and whether children can be
  arbitrary elements or only its own widget kinds.
- **Reuse 2 — embedded HA action editor.** The widget config dialog already
  embeds native HA surfaces (entity picker, icon picker, action-type
  selector, service picker with typed data fields + target picker).
  Extract: the component-loading mechanism, the component list, version
  guards — reuse for the slot editor tiers 1–2.

**External:**

- **scheduler-component + scheduler-card** (nielsfaber) — proves the
  integration + bundled-card + own-dispatcher architecture at scale; closest
  structural precedent. Model the WS command style on it.
- **universal-remote-card** (Nerwyn) — UX depth benchmark for a remote-shaped
  config UI (different problem: virtual remote *controlling* devices).
- **Awesome HA Blueprints / ControllerX** — the incumbent approaches this
  design replaces (form-based blueprints; AppDaemon YAML). No visual
  assignment surface exists in the ecosystem — the niche is open (verified
  July 2026).

## 14. Risks

1. **Embedded HA components break on a frontend refactor** — highest
   likelihood. Contained: loading mechanism from the canvas repo,
   feature-detect at card load, YAML tier always works, materialize toggle
   reaches the native editor regardless.
2. **Config REST endpoints change shape** — low likelihood (stable for
   years). One wrapper module per endpoint family.
3. **Z2M action naming churn** — likely, external. Contained by adapter #1
   (raw MQTT), per-slot `schema_version`, stale-mapping badges.
4. **`Script` helper signature change** — very unlikely.

## 15. Test plan

`pytest-homeassistant-custom-component` (backend) + Playwright /
hass-taste-test (E2E), per existing project conventions:

- Adapter conformance, parametrized over all adapters: `build_trigger`
  output passes `cv.TRIGGER_SCHEMA`; subscribe/unsubscribe symmetry.
- Dispatch: assigned fires; empty/archived/materialized skipped; dangling
  scene pointer no-ops without raising.
- Materialize → edit-externally → dematerialize round-trip: final stored
  sequence equals the externally edited one; automation deleted (or
  disabled under `never_delete`).
- Clear flow: all three `owned_scene_cleanup` values × owned/hand-made
  scene; bulk entry removal shows one batch dialog.
- Snapshot: default entity set applied; per-snapshot override stored;
  re-snapshot reuses scene id and entity set; owned_scenes bookkeeping.
- Store migrations per schema version bump.
- E2E: load card → assign quick-chip action → save → synthetic adapter
  event → assert service called; snapshot chip creates scene + binding.

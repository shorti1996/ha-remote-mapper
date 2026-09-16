# Create-new flow — scene, button automation, remote automation

> Plan written 2026-09-16. Replaces the blind 📸 Snapshot button with a
> "Create new" group in the slot editor, and adds the one-automation-per-
> remote shape (importer's "Shape A") as a first-class target.

## Why

- Snapshot failed with "No capturable entities" because the card never
  sent an entity list and the per-remote default (`snapshot_entities`
  option) was empty. Design §8 planned a per-snapshot picker; it was never
  built.
- Users who prefer HA's editor want the card to hand them an empty shell
  with the right trigger, not a composed sequence. Some want one automation
  per button (Shape B), some want one automation per remote with a
  `choose` keyed on trigger ids (Shape A — the blueprint look).

HA docs: the UI edits any automation in `automations.yaml` that has an
`id`. Ours always do. "Choose + Triggered-by condition per trigger id" is
HA's own recommended pattern for one automation with many triggers.

## Slot editor

Action dropdown, top group "Create new":

| option | form | Save does |
|---|---|---|
| ＋ Scene from current state | entity multi-picker (pre-filled from the remote default), "remember as default" | `create_snapshot` with entities + name (+ writes the option) → slot = `scene.turn_on` |
| ＋ Automation for this button | name only | `create_automation scope=button` → Shape B shell, empty actions, slot owned-linked → jump to HA's editor |
| ＋ Automation for the whole remote | name only | `create_automation scope=remote` → Shape A with a trigger + empty branch per known event; card-built slots move their sequence into their branch; per-slot materialized and linked slots stay untouched → jump to HA's editor |
| ＋ Add this button to the remote automation | (shown instead of the row above once the remote automation exists) | `create_automation scope=remote` → appends trigger + branch for this event only |

"Create as automation" checkbox is hidden in these modes. Re-snapshot
stays. The 📸 button goes.

## Remote automation (Shape A) rules

- id `remote_mapper_{entry_id}`, alias `[remote_mapper] {title}`, mode
  `parallel` (buttons are independent), one trigger per event with
  `id: <action_id>`, actions = one `choose`, branch = `conditions:
  [{condition: trigger, id: <action_id>}]`, `sequence: [...]`.
- Slot record: `materialized: true, automation_id: <shared id>, owned:
  true, shared_automation: true, sequence: []`. `imported_from` is kept
  (also on plain link) so the originals' chips survive.
- The automation is canonical; the card resolves a slot's branch on every
  read by trigger id, with a fallback that maps triggers to events by
  their subtype / payload / event type (renamed ids still resolve).
- Branch missing (user deleted it in HA): slot reports `branch_missing`;
  the editor offers "Re-add branch" (= scope remote again).
- User-restructured automations (a `default`, non-trigger-keyed branches)
  are shown as-is and never rewritten; add/remove only touch the branch
  and trigger keyed to one event.
- Clear on a shared slot removes its branch and trigger; the automation
  is deleted only when the last branch goes. Unticking "automation" on a
  shared slot pulls the branch's sequence into the card and removes the
  branch (never deletes the shared automation).
- Hand-back unmanages the shared automation once (dedupe by config id).
- Entry removal with policy `always_delete` deletes the shared automation.

## Live view for any single-choose automation

`get_slot` live view and `get_remote` per-slot `live_actions` resolve the
branch for both the shared automation and imported Shape A automations
linked via the import wizard. Non-choose automations return the whole
action list as today.

## Chips in the button sheet

Fixed order, all shown together: 🎨 scene (from the slot sequence or the
live branch when it is a single `scene.turn_on`), 🤖 the slot's automation
(own or shared, dimmed when off), then one robot-off chip per imported
original.

## Websocket

- `create_automation {entry_id, action_id, scope: button|remote, name?}` →
  `{config_id, entity_id, edit_url}`.
- `create_snapshot` gains `remember_entities: bool`.
- `get_remote` gains `remote_automation` (or null), `snapshot_entities`,
  and per materialized slot `live_actions` + `branch_missing`.

## Files

- new `remote_automation.py` — payload builder, branch find/add/remove,
  branch-aware view; `materializer.async_get_live_view` delegates.
- `websocket.py` — new command, snapshot option write, shared guards in
  save/clear, richer get_remote.
- `cleanup.py`, `release.py` — shared-aware.
- card: quick tab modes, chips, summaries from `live_actions`.
- tests: `test_remote_automation.py`, additions to `test_link.py`,
  `test_snapshot.py`, `test_release.py`.

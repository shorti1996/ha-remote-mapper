# Move actions between remotes — picker and cross-card drag

> Plan written 2026-10-14. Extends the Move… picker (todo 5, shipped 0.1.8)
> to events of other remotes, and lets an event mark be dragged from one
> card onto another. Todo item 10, first half: swapping whole remotes is a
> later step that composes these moves.

## Why

- A remote dies or gets replaced. Its actions should land on the new one
  without being rebuilt by hand, event by event.
- Two remotes in one room: a scene built on the bedside remote is wanted
  on the wall remote instead.
- The picker already lists every event of the remote and the grid already
  drags marks between pads. The missing piece is a second remote as the
  target.

## What moves, and what happens to it

An event's action has two independent properties. **What it does** is
the content of its sequence, picked in the editor's Action dropdown.
**Where it lives** is the slot kind from `move.py` `_kind`: in the card,
in an automation the card made, as a branch of the remote automation, or
in the user's own automation. Only where it lives decides whether a move
is allowed. What it does only decides what travels with it.

### What it does: always moves, the content is copied as is

| Action dropdown | sequence | what travels, within or across remotes |
|---|---|---|
| Toggle entity | `homeassistant.toggle` | the step |
| Activate scene (hand-made) | `scene.turn_on` | the step; the scene is the user's, untouched |
| Scene from current state (snapshot) | `scene.turn_on` on an owned scene | the step and the ownership record, re-pointed to the new event; the scene keeps its id and entities; re-snapshot keeps working on the new event |
| Run script | `script.turn_on` | the step |
| Set WLED preset | a `select` call | the step |
| YAML tab, anything | the list | the list |
| Absorbed import (unticked link or import wizard) | the copied actions plus `imported_from` | within a remote the trail travels; across remotes it stays with the source remote (next section) |

Name and the disabled flag travel in every case.

### Where it lives: decides allowed or refused

| slot kind | how it got there | within one remote (today) | to another remote (new) |
|---|---|---|---|
| **in the card** (`plain`) | Save with "Create as automation" unticked | allowed: record travels | **allowed**: record travels |
| **own automation** (`owned`) | "Create as automation" ticked, or "＋ Automation for this button" | allowed: automation deleted, re-created for the new event | **allowed**: re-created with B's trigger, B's title, id `remote_mapper_<B>_<event>` |
| **branch of the remote automation** (`shared`) | "＋ Automation for the whole remote" / "＋ Add this button to the remote automation" | allowed: branch re-keyed | **allowed**: branch detached (as unticking does), then added as a branch of B's remote automation when B has one, else kept in the card on B |
| **linked, flat** (`linked`, no `choose`) | "Link existing automation" to a one-trigger automation | allowed: its trigger becomes the target's | **allowed**: A's trigger goes out, B's goes in; linked from B now |
| **linked, branch** (`linked`, Shape A) | "Link existing automation" to a per-remote automation | allowed: branch re-keyed | **refused**, before any write: "this automation is built for <remote A>; link it from the other remote, or change its trigger in HA". One re-keyed branch would make the automation span two devices, which blocks every later absorb (`per_remote_plan` → `foreign`). |
| **disabled** (any kind, `archived`) | Disable button | allowed, stays disabled | **allowed**, stays disabled: `async_materialize` switches the new automation off, a card record keeps the flag |
| **empty** | | nothing to move | nothing to move |

Targets: any event of B, set or not. A set target swaps, and each
direction goes through the table on its own, so a swap is refused when
either direction is (a target holding a linked branch automation, for
one).

Every action id of remote B is a valid target, whatever its name: the
user picks it. `1_single` on a Z2M remote can land on
`button_2_3:multi_press_1` on a Matter one. A pad drop keeps the kind
(single → single on that button), as it does within one remote.

### The import trail stays with remote A

An absorbed import disabled an automation that fired on A's buttons.
Handing A back must turn it on again, whichever remote now holds the
actions; handing B back must not. So a cross-remote move:

- adds the slot's `imported_from` sources to A's `disabled_originals`
  (recent imports record them there already; this covers trails from
  before `disabled_originals` existed), and
- strips `imported_from` from the record before it is written to B. The
  "imported from" chip would otherwise point at an automation for a
  different device.

`_async_reenable_if_ours` on A keeps working: it reads
`disabled_originals` first.

### What is reset

`last_run` and `last_error` are cleared (as today). `updated_at` is set
by the store. The slot name and the scene are kept.

### What stays out

- Whole-remote swap (todo 10, second half): N moves in one dialog, with a
  mapping step for remotes with different button counts. Builds on this.
- Moving to a remote whose target event is **stale** (in the layout but no
  longer reported): allowed, same as within a remote. The card already
  marks stale events.
- Auto-scrolling the page while a mark is dragged on a phone: the other
  card has to be on screen. Noted in the hint.

## Backend

### `move.py`

`async_move_slot` gains `target_entry_id: str | None = None` and
`target_title: str | None = None`. Same entry → the existing path,
untouched. Different entry → `_async_move_across(hass, store, src_entry,
source, dst_entry, target, titles)`:

1. Resolve both remotes; `target` must be in B's layout actions. Build
   `moves = {(A, source): (B, target)}` plus the reverse pair when the
   target is set.
2. Classify every moved slot. Refuse (before any write) a linked branch
   automation; refuse a flat linked automation whose other triggers belong
   to anything but the source event (it would keep firing for A).
3. Per moved slot, in this order, so a failure leaves HA matching the
   card as far as possible:
   - linked flat → `async_move_branches`-style trigger swap, but the new
     trigger is built by **B's** adapter: factor `_move_flat_triggers` to
     take the trigger instead of `(adapter, remote)`.
   - shared → `async_detach_branch(A)` (branch sequence into the record,
     branch removed; the automation is deleted when it was the last one).
   - owned → `async_dematerialize(A)`.
   - plain → nothing.
4. Records change places: clear on A, write on B with the import trail
   moved to A's `disabled_originals`; `store.async_move_owned_scene(id,
   f"{B}/{target}")`.
5. Re-create on B: owned → `async_materialize(B, target, title_B)`;
   shared, when B has a shared automation → `async_add_branch(B, target)`;
   otherwise the record stays card-run (the hint in the picker says so).
6. Return `{"moved": [...], "swapped": bool, "entries": [A, B]}`.

The dispatcher reads the slot at fire time (`dispatcher.py:88`), so
neither remote re-attaches.

### `store.py`

Nothing new. `async_move_owned_scene` already re-points ownership and
`owned_scenes_for` keys on the prefix, so A's entry removal leaves the
scene alone and B's cleanup finds it. The scene id keeps A's prefix;
`_free_scene_id` already copes with ids that do not match their slot.

### `websocket.py`

`move_slot` takes `vol.Optional("target_entry_id"): str`. Both entries
must exist. `_fire_updated` for A **and** B so both cards refetch; kind
`slot_moved` on both.

`get_remote` is called by the picker for each other remote. It returns
`buttons`, `grid_layout` and `slots`, which is all the picker needs; no
new command.

### Tests (`tests/test_move.py`)

Second remote in the same test: a `z2m_mqtt` or `mqtt_generic` entry
(see `test_fallback_adapters.py:131`, no device registry needed) with its
own action ids, so the test exercises an id that means nothing on A.

- plain → plain across; scene owner re-pointed; A's entry removal keeps
  the scene; B's clear with delete removes it.
- owned across: automation gone under A's id, present under B's id with
  B's trigger; disabled stays off.
- shared across, B without a shared automation → card-run on B; A's
  automation loses the branch (deleted when last).
- shared across, B with a shared automation → branch on B with the
  sequence.
- linked flat across: trigger replaced; linked branch across: refused,
  nothing written (compare `automations.yaml` before and after).
- import trail: `imported_from` stripped on B, source listed in A's
  `disabled_originals`; releasing A turns the original on.
- swap across with one refused direction → nothing changes.
- both `EVENT_UPDATED` events fire.

### Stress walk with two remotes (`make test-deep`)

The random walks in `test_stress_mix.py` and `test_stress_content.py`
already move slots at every step and then press and tap every event
against a model. Cross-remote moves get the same treatment in a new
`tests/test_stress_remotes.py`, so the existing walks keep their run
time and their seeds.

`stress_rig.py` gains a second remote:

- `make_pair(hass, hass_ws_client, device_a, natives)` returns two
  `Rig`s. Remote B is a second Z2M device (own identifiers, own topic
  `zigbee2mqtt/remote_b`), discovered the way `make_rig` discovers the
  extra events of A, with the same six event names. `Rig` learns its
  topic (`press` fires on it) and `move` takes `target_rig=None`.
- Effects are counted once for the whole HA, so a press on A proves that
  nothing on B ran, and the other way round.

The walk keeps one `Model` per rig and adds one op, `across`, weighted
like `move`: a source on either rig (plain, owned, shared, with or
without a scene) to any non-linked event of the other rig, set or not.
The model update is the table from "What moves": kind and `via` swap
between the two models; `shared` becomes `plain` on a rig without a
shared automation and stays `shared` on one with it; a scene follows;
an `origin` (absorbed native) is dropped on the receiving model and the
event is added to the sending model's `disabled_by_us`. After each step
`_assert_stored` runs for both rigs and `check` presses and taps all
twelve events.

Scripted scenarios in the same file, next to the walk:

- scene across, then re-snapshot on B, then clear on A's old event with
  a new snapshot there (two scenes, no overwrite);
- shared across to a B without a shared automation (plain on B), then
  "add to remote automation" on B;
- absorbed import moved across, then A released: the native is back on,
  B's copy still runs on B's press;
- linked branch across is refused and `automations.yaml` is unchanged.

Run time: a walk step checks twelve events instead of six, so this file
roughly matches one existing walk file. `make test-deep` grows from
about 7 to about 10 minutes.

## Card: the picker

`move.ts` `MoveGroup` gains `entryId` and `remoteTitle?`. `moveGroups`
keeps its signature for the current remote; a new `otherRemoteGroups
(remotes: RemoteView[], current entryId)` maps each other remote through
the same grouping. `<select>` cannot nest optgroups, so a group of another
remote is labelled `"<remote title> · <button label>"`; the current
remote's groups stay as they are and come first.

Loading: when the panel opens, `list_remotes`, then `get_remote` for every
other entry, kept in `@state() _otherRemotes` until the editor closes.
With one remote configured nothing changes on screen.

`_moveTarget` becomes `{entryId, actionId}` (or a `"<entry>/<action>"`
string, since `<option value>` is a string). `_performMove(source,
target, targetEntryId)` passes `target_entry_id` when it differs.

Hint text, added to the existing paragraph when the chosen target is on
another remote: "The action moves to <remote>. A branch of this
remote's automation becomes a plain action there" (when B has no shared
automation) or "…joins that remote's automation" (when it has one).
Linked slots: the picker lists other remotes only when the live view
says the automation is flat (`live.branch === false`); otherwise the
other remotes' groups are left out and the hint says why.

Toast after a cross-remote move names both: "Moved single (Bedside) to 2
single (Wall)".

## Card: drag between cards

Every card on the page is the same class from the same module, so a
dragging grid can find another grid under the pointer and talk to it
directly. No shared state, no window events.

### Hit testing across shadow roots

`shadowRoot.elementFromPoint` only sees its own tree. New helper in
`move.ts`, pure over a start node:

```ts
/** Deepest element at (x, y), drilling through open shadow roots. */
export function deepElementAt(root: DocumentOrShadowRoot, x, y): Element | null
```

Loop: `el = root.elementFromPoint(x, y)`; while `el?.shadowRoot`, take
`el.shadowRoot.elementFromPoint(x, y)` and stop when it returns the same
element or null. From `document` this reaches, in order, `hui-root →
hui-view → hui-card → remote-mapper-card → remote-mapper-grid → .cell`.

### Grid changes (`remote-grid.ts`)

- `_onMarkMove`: when the own-root hit finds no mark and no pad, call
  `deepElementAt(document, x, y)` and take `closest("remote-mapper-grid")`
  from the result's root host chain. Another grid that is `editing` and
  has an `entryId` is a foreign target. Ask it: `otherGrid.dropHitAt(x,
  y)` (new public method, the same `[data-action]` / `.cell.btn` lookup
  the grid already does for itself) and run `dropTargetFor` with
  **its** `buttons`.
- Highlight on the other grid: `public externalDrop?: string` (an action
  id); the dragging grid sets it on the target grid and clears it on
  leave, up or cancel. `_padDropFor` and the mark's `drop` class read
  `_actionDrop ?? externalDrop`.
- `_onMarkUp` with a foreign target: emit `move-action` with
  `{actionId, targetId, target}`, where `target` names the other remote,
  the event there and what is set on it (the grid's `describe()`).
- The one-time hint on the first mark drag rides on a `mark-drag-start`
  event from the grid. Its first name was `drag-start`, which HA's grid
  section takes for its own card sorter: it hides every card's edit
  overlay until a `drag-end` that never came, so after one mark drag no
  card on the view could be opened in HA's dashboard editor. Composed
  events that leave the card need a name HA does not listen for;
  `test/remote-grid.test.ts` pins this one.
- Two remotes name their events alike (`1_single` on both), so the
  "not the source itself" refusal in `dropTargetFor` only applies when
  the other card shows the same remote. Found in the browser check: a
  drop on the other remote's button 2 from this remote's `2_single`
  showed no ring.
- New `@property() entryId` so a grid can be named; the card passes
  `this._entryId`.
- The ghost is `position: fixed` with viewport coordinates, so it follows
  the pointer over the other card as long as no ancestor creates a
  containing block. HA's masonry view does not; verify in the sections
  view (step 9 below) and fall back to a `document.body`-level ghost if
  it clips.

### Card changes (`remote-mapper-card.ts`)

`_onMoveAction(source, target, targetEntryId?)`: a foreign entry id that
equals the card's own is a plain within-remote move (two cards of one
remote on a page). A real cross-remote drop **always confirms** first,
set target or not: "Move 'Toggle Kinkiety' to Wall remote, 2 single? This
is saved right away." A toast only is too easy to miss when the action
leaves the card that was being edited.

Both cards have to be in edit mode. The dragged card is by definition;
the target grid refuses a drop while not `editing`, so a card the user
is not working on cannot change under them. The edit-mode hint gains a
line: "· Drag an event mark onto another remote's card (in edit mode) to
move it there".

### Tests

- `move.test.ts`: `otherRemoteGroups` labels and order; `deepElementAt`
  with a stub root chain (two levels, one returning null).
- Grid: the existing `remote-grid.test.ts` covers rendering; a drag test
  with two grid instances is a Playwright job only if the manual check in
  step 9 finds a problem (see memory: browser checks are one-off via
  Claude in Chrome, Playwright only for committed tests).

## Order of work

1. `move.py`: `_async_move_across` + the flat-trigger factoring. ~1.5 h.
2. `websocket.py`: `target_entry_id`, two `_fire_updated`. ~15 min.
3. `tests/test_move.py`: the list above. ~1.5 h.
4. `stress_rig.py` second remote + `tests/test_stress_remotes.py` walk
   and scenarios; run once with `STRESS_SEEDS=20`. ~2 h.
5. `move.ts`: `otherRemoteGroups`, `deepElementAt`, tests. ~45 min.
6. Picker: load other remotes, labelled groups, hint, toast. ~1 h.
7. Grid: `entryId`, `dropHitAt`, `externalDrop`, foreign hit path. ~1.5 h.
8. Card: `_onMoveAction` with entry id, confirm dialog, hint line. ~30 min.
9. `make test` and `make test-deep` (ruff, mypy, pytest, vitest, build). ~30 min.
10. Browser check on dev HA with two cards: picker move, drag move, drag
    swap, drop on a non-editing card (must do nothing), sections view ghost.
    ~45 min.
11. README (Move… section), CHANGELOG Unreleased, todo 10 first half
    struck through. ~20 min.

About a day and a half end to end.

# Group actions into buttons — fixing the grid for remotes the grouper does not know

> Plan written 2026-10-14. Todo item 9. Lets the user say which button an
> action belongs to and which press kind it is, for remotes whose action
> names `buttons.py` cannot split, and for auto-grouped remotes where the
> split came out wrong.

## What the card shows today

`buttons.py` derives buttons from action ids by vocabulary: `1_single`
→ button `1`, event `single`. An id with no known event token becomes a
button of its own with one event, `press`. A real IKEA STYRBAR (E2001)
on Zigbee2MQTT publishes these eleven actions:

```
on  off  brightness_move_up  brightness_move_down  brightness_stop
arrow_left_click  arrow_left_hold  arrow_left_release
arrow_right_click  arrow_right_hold  arrow_right_release
```

The remote has four buttons. The card shows seven, sorted by name
(checked in the dev HA with `test/styrbar`, a generic-MQTT entry with
that list, entry id `01M4X80HH61VMPQ73DQMR440T1`, kept for the browser
check at the end):

| cell | derived button | events |
|---|---|---|
| 1 | `arrow_left` | click, hold, release |
| 2 | `arrow_right` | click, hold, release |
| 3 | `brightness_move_down` | press |
| 4 | `brightness_move_up` | press |
| 5 | `brightness_stop` | press |
| 6 | `off` | press |
| 7 | `on` | press |

What the user wants is `on` = {on: single, brightness_move_up: hold,
brightness_stop: release}, `off` = {off: single, brightness_move_down:
hold}, and the two arrows as they are. Today the only tools are the
grid shape, cell swaps and a label per cell. Nothing moves an action from
one button to another or changes its press kind, so replica mode (one
gesture per kind) and assisted mode (one fan per button) cannot be made
to match the physical remote.

The same mechanism covers the second half of the todo item: a Z2M
vocabulary that the splitter reads wrong (`single_left` on an Aqara
rocker is handled, but a vendor can always invent a new shape) gets the
same per-action fix instead of a new rule in `_KIND_BY_EVENT`.

## The model: one override per action, derived grouping for the rest

A remote record gains `grouping`, a map from action id to where that
action lives:

```json
"grouping": {
  "brightness_move_up":  {"button": "on",  "kind": "hold"},
  "brightness_stop":     {"button": "on",  "kind": "release"},
  "brightness_move_down":{"button": "off", "kind": "hold"}
}
```

`group_buttons(source, action_ids, grouping)` places an action listed
in `grouping` on that button with that kind, and derives every other
action as it does now. Nothing else changes shape: the card still gets
`buttons` already grouped, so the grid, the sheets, the Move… picker,
the cross-card drag and the slots (keyed by action id) all keep working
without a change.

Rules, all in `buttons.py`:

- **A button id is just a name.** `"on"` here is the derived button
  `on`, so the override merges into it. A name no derived button has
  (`"top"`) creates a new button. There is no separate "custom button"
  type; a button exists while at least one action is on it.
- **Event name on a moved action.** An action that stays on its derived
  button and only changes kind keeps its derived event name
  (`arrow_left_click` stays `click`). An action moved to another button
  shows its action id as the event name (`brightness_move_up`), so the
  sheet says what fires and never two rows called `press`.
- **Order inside a button** stays kind order, then natural order of the
  event name. Buttons stay in natural order of their id; the grid layout
  decides where they sit anyway.
- **One action per named kind on a button.** single, double, triple,
  hold and release each resolve to one action in replica and assisted
  mode (`actionOfKind` takes the first), so a second one would be
  unreachable. `other` has no gesture, so any number of actions may be
  `other`. The WebSocket handler refuses a change that would double a
  named kind.
- **A stale override** (action id no longer in `layout.actions`) is
  ignored by `group_buttons` and removed when the action is next changed
  or the override is reset. Nothing to migrate: `remote.get("grouping",
  {})`, and `async_ensure_remote` adds `"grouping": {}` to new records.

Automation aliases follow. `naming.event_label` builds "button label +
event" from `split_action`; it moves to a shared `place_action(source,
grouping, action_id) → (button_id, event, kind)` so an alias written
after a regroup says `on brightness_move_up`, not
`brightness_move_up press`.

Out of scope, same as today: the canvas layout is one tile per action
and ignores buttons; the dispatcher, materializer and move code key on
action ids and never see buttons.

## WebSocket

`remote_mapper/group_action`:

| field | | |
|---|---|---|
| `entry_id` | required | |
| `action_id` | required | must be in `layout.actions`, else `not_found` |
| `button` | optional string, trimmed, non-empty | absent = remove the override (back to derived) |
| `kind` | optional, one of the six kinds | absent = keep the action's derived kind |

The handler builds the would-be grouping, runs `group_buttons` on it,
and refuses with `invalid_format` and a sentence naming the clash
("button on already has a hold event: brightness_move_up") when a named
kind would appear twice on one button. On success it stores the map,
schedules a save and fires `EVENT_UPDATED` with kind
`grouping_changed`, so every card of that remote refetches.

`remote_mapper/reset_grouping` (`entry_id`) clears the map. One call,
same event.

`get_remote` adds `grouping` to its result next to `buttons`, so the
sheet can mark which rows are overrides. `list_remotes` is unchanged
(the Move… picker calls `get_remote` per remote already).

## The card

Everything lives in the button sheet (`_renderButtonSheet`) and only
while the grid is in edit mode, next to the Label field that is already
there. Grouping saves right away, like event edits, and is not part of
the ✓/✕ layout draft: a new button has to exist on the server before the
draft can place it. The existing refresh path already re-normalizes the
draft after a fetch (`_refreshActions` does it for found actions), so
the card reuses that: after `group_action` resolves, `_fetchRemote`
then `normalizeGrid(this._gridDraft, buttons)`. A button that lost its
last action drops out of the draft the same way.

Each event row in edit mode gains two controls at the start of its
`ev-actions` span:

1. **Press kind**: a native `<select>` showing the mark and the kind
   title (`1 single press`, `⧗ hold`, …), current kind selected. Changing
   it calls `group_action` with the row's current button and the new
   kind. A refused change (kind taken) shows the server's sentence as a
   toast and the select snaps back.
2. **Move to button…** (`mdi:folder-move-outline`): opens a small inline
   list in the sheet, below the row: every other button by its label,
   then `New button…`, which turns into a text input (the name becomes
   the button id; a name that matches an existing button merges into
   it). Picking one calls `group_action` with that button and the row's
   current kind; when that kind is taken on the target the server
   refuses and the toast says so, and the user changes the kind first.

A row that is an override (its action id is in `grouping`) shows a
small `mdi:undo-variant` "Back to its own button" after the two, which
calls `group_action` without `button`. The sheet's title keeps
`label (id)`, so a merged or new button reads `on (on)` or
`Top (top)`.

One more line in the edit-mode hints: "· In a button's sheet, change an
event's press kind or move it to another button (unsupported remotes)".

A **Reset grouping** entry joins the card editor's "Start over" section,
the place that already holds the other per-remote resets. It asks first
and names the count of overrides.

Not in this plan, noted as a later gesture: dropping a mark on a pad that
has no event of its kind could regroup instead of refusing. Today a mark
drag moves slot content between same-kind events, and a second meaning
on the same gesture would need its own affordance.

### Pure helpers, `grouping.ts` (vitest)

- `kindOptions(kindIcons)`: the six `{kind, mark, title}` rows for the
  select, in `KINDS` order.
- `moveTargets(buttons, layout, currentId)`: other buttons in reading
  order of the layout (reuse `moveGroups`' ordering), each `{id, label}`.
- `isOverride(grouping, actionId)`.

## Tests

- `tests/test_buttons.py`: merge into a derived button; new button; kind
  change on the derived button keeps the event name; a moved action's
  event name is its id; `other` twice on one button is fine; the
  named-kind clash is detected (a `grouping_conflict(buttons)` helper the
  handler uses); an override for an unknown action id is ignored; the
  STYRBAR list with the three overrides above yields four buttons with
  the expected events and kinds.
- `tests/test_websocket.py`: `group_action` round trip visible in
  `get_remote` buttons and `grouping`; remove; unknown action →
  `not_found`; clash → `invalid_format` with the button and kind in the
  message; `reset_grouping`; `EVENT_UPDATED` fired with
  `grouping_changed`.
- `tests/test_materializer.py` or a new case next to the alias tests:
  `event_label` after a regroup reads `on brightness_move_up`.
- `frontend/test/grouping.test.ts`: the three helpers.
- `tests/test_stress_grouping.py` (added after the first run, on request):
  the two-remote walk from `test_stress_remotes` with every third step a
  grouping op (group, undo, reset). The walk's own `check()` proves a
  grouping change never alters what a press or tap runs; a model of the
  overrides is compared with the store, `get_remote` and `get_options`
  after each step, and the server's accept-or-refuse decision is
  predicted with `group_buttons` + `grouping_conflict`. It found one
  behaviour worth knowing: an undo is refused when another override now
  occupies the event's derived place (`2_hold` moved to button 1 blocks
  `1_hold`'s way back); the toast names the event in the way.
- Browser check on the dev HA, `test/styrbar`: move `brightness_move_up`
  to `on` as hold, `brightness_stop` to `on` as release, try `off` as a
  second single on `on` (must refuse with the toast), change `on`'s kind
  to double and back, `New button…` named `top`, then rename it with the
  Label field, Reset grouping from the card editor. Replica mode on the
  result: hold on `on` runs the hold slot.

## Order of work

1. `buttons.py`: `place_action`, `grouping` in `group_buttons`,
   `grouping_conflict`; `naming.event_label` on `place_action`. ~1 h.
2. `store.py` default, `websocket.py`: `group_action`, `reset_grouping`,
   `grouping` in `get_remote`. ~45 min.
3. `tests/test_buttons.py`, `tests/test_websocket.py`, the alias case.
   ~1.5 h.
4. `grouping.ts` + tests. ~45 min.
5. Sheet: kind select, Move to button… list with New button…, undo
   control, refetch + re-normalize after each call, hint line. ~2.5 h.
6. Card editor: Reset grouping in Start over. ~30 min.
7. `make test` and `make test-deep`. ~30 min.
8. Browser check above. ~45 min.
9. README: a short "Unsupported remotes" paragraph under Supported
   remotes pointing at the sheet; CHANGELOG Unreleased; todo 9 struck
   through. ~30 min.

About one working day.

## Found on the way, not part of this plan

ZHA and Z-Wave remotes collapse press kinds before the grouper ever sees
them: `device_trigger.py` uses the trigger `subtype` as the action id,
and on those platforms the subtype is the button (`turn_on`, `Scene
001`) while the press kind is the trigger `type`
(`remote_button_short_press`, `KeyHeldDown`). Every kind of one button
lands on one action id, so one slot fires for short, long and double.
Grouping cannot fix that; the adapter would have to key by
`type`+`subtype` when a subtype appears under several types. Worth its
own todo entry.

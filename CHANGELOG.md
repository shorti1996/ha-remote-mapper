# Changelog

Notable changes per release. Unreleased entries collect on `master` and
move under a version heading when `make release VERSION=x.y.z` runs.

## 0.1.6 — 2026-09-24

### Added

- **Hide events that are not set.** A switch in the card editor for the
  *All visible* display (`hide_unset: true` in YAML) leaves out the chips
  of events with nothing assigned: a 4-button remote with five events set
  shows five chips instead of twelve. The pencil's edit mode still shows
  every event.

### Fixed

- **Remotes that name the press first get one pad per button.** Aqara
  double rockers and wall switches (`single_left`, `hold_both`), the Sonoff
  SNZB-01M (`single_button_1`) and the Hue Tap (`press_1`), 48 Z2M remotes
  in all, showed every action as its own pad: the WXKG15LM had 12 pads
  instead of *left*, *right* and *both*. Actions already assigned keep
  working; the pads of these remotes lose their saved position and label
  once. Also recognised: `pressed`, `held`, `released`, `longpress`,
  `many` (Aqara, five or more presses) and `tripple` (LeTV).

## 0.1.5 — 2026-09-24

### Fixed

- **Scene from current state works on HA 2026.7 lights.** Capture failed
  with "cannot represent an object … LightEntityCapabilityAttribute" because
  HA now keys light attributes with a StrEnum and stores `ColorMode` members
  as values, which the YAML writer refuses. Enum members are flattened to
  their plain values before the scene is written.
- **Unticking "Keep linked" absorbs again.** On a linked event the editor
  opens on Quick / "Link existing automation"; saving from there re-sent the
  link and ignored the unticked box, so the automation stayed native and
  enabled. The save now sends only `materialized: false`, which the backend
  already treats as absorb (copy in, disable the original).
- **Absorb → Clear → Link no longer leaves the original off.** Each remote
  now records the automations it disabled, so clearing an absorbed event no
  longer loses track of them. Linking one of them again (Import's default,
  or *Link existing automation*) switches it back on, unless another event
  still runs an absorbed copy. Hand back re-enables every recorded original.
- **The card uses the device's name.** The card editor's remote list, the
  default card title and the hand-back dialog showed the config entry title
  (the name at setup), not the name given to the device afterwards.
- **An absorbed event keeps the automation's name.** Import (absorb) and
  unticking *Keep linked* name the event after the automation's alias; a
  per-remote automation (one `choose` branch per event) uses the branch's
  alias, if any. Steps without a target now name their domain: "Create
  persistent notification" instead of "Create".
- **Retrying an abandoned Add-remote dialog works.** A setup left open (page
  reloaded mid-flow) blocked the next attempt with the raw key
  `already_in_progress`. The new flow replaces it; the message has a text if
  it ever shows.
- **Unlinking one event of a per-remote automation no longer breaks the
  others.** For an automation with one `choose` branch per event, unticking
  *Keep linked* copied the whole `choose` into that one event and turned the
  automation off, so the other buttons stopped. After a confirmation that
  lists them, every event the automation runs on this remote now gets its own
  branch, and the automation is turned off once. It is refused when the
  automation also runs on another remote's or device's triggers, has
  conditions on the whole automation or a `default` branch, or when one of
  those events already has its own action. In the first three cases the
  editor locks the checkbox and shows the reason instead of offering the
  untick.
- **Disabling one linked event disables all events linked to the same
  automation.** The automation goes off in HA as a whole; the dialog lists
  the events and all of them are marked disabled. For an automation that
  also runs on another remote, *Disable* is greyed out. Disabled buttons in
  the event editor now look disabled.

### Changed

- **Archive is now called Disable** (*Enable* to undo), HA's word for an
  automation that is switched off. The event keeps its setup.
- **Automations the card creates are named `<remote> · <event> [remote_mapper]`.**
  The event is the slot name, else the name the card inferred from the
  actions, else the button label and event. The tag moved from the start to
  the end, so HA's automation list sorts by remote. Existing automations keep
  their alias until their event is saved again; hand back strips the tag in
  either position.
- **Pads show what an automation-backed event does.** They showed the
  automation's alias; they now show the inferred name, as for card-built
  events. Linked automations still show their own name, except a per-remote
  one, whose name fits every event: its events show their branch.
- **The canvas D-pad sits below the tiles.** It floated over the bottom-right
  corner and hid tiles in a narrow card. Its buttons are now 40 px touch
  targets sized with HA's tokens, and the position readout shows only while
  dragging. The layout option reads *Canvas — free placement, one tile per
  event* (was "(legacy)").
- **The canvas tile toolbar uses HA icon buttons.** *Slot settings*, *Send
  backward* and *Bring forward* are 48 px icon buttons with tooltips (were
  ⚙ ↓ ↑ glyphs sized in `em`).
- **The card title stays readable in edit mode.** In a narrow card the six
  edit buttons squeezed the title down to one letter; they now wrap onto a
  row of their own.
- **Empty events read "not set"** (was "unassigned", cut to "unassign…" on
  narrow pads).

### Tested

In a dev Home Assistant 2026.7.2, with a demo automation that has one
`choose` branch each for buttons 1 and 2 of a 4-button remote:

- Import offered *Link* for both events.
- *Disable* asked "Disable 2 events?" and named both. The automation went
  off and both pads dimmed; *Enable* turned the automation and both events
  back on.
- Unticking *Keep linked* asked "Move the whole automation into the card?".
  After *Move all 2*, each event had its own branch, button 1 took its
  branch's name ("Strip on"), the automation was off, and running button 1
  from the card posted its notification.
- With an extra trigger from outside the remote in the automation, the
  checkbox stayed locked, *Disable* was greyed out, and the editor showed
  why.
- After *Clear* the automation stayed off; linking it again turned it back
  on.

## 0.1.4 — 2026-09-23

Python changed, so restart Home Assistant after updating.

### Fixed

- **Linked automations survive editing.** Opening a slot linked to a native
  automation showed the YAML tab; saving from there replaced the link with a
  new integration-owned automation and left the original enabled, so the
  button fired twice. Linked slots now open on Quick / "Link existing", the
  backend refuses a sequence while the link is kept, and only the name can
  change. (`eca23e9`)
- **Absorb keeps your edits.** Unticking "Keep linked" after editing the
  YAML now absorbs the edited actions, not the automation's live ones.
  (`eca23e9`)
- **Archive now stops the button.** Archiving an automation-backed slot used
  to set a flag while the automation kept firing. It now switches the
  automation off, and on again on unarchive. A branch of the shared
  per-remote automation is refused with a message, since that would silence
  every button. (`eca23e9`)
- **Pencil edits no longer vanish.** A grid edit left unticked was dropped
  whenever HA's card editor re-sent the config, on Save in the card dialog,
  or after navigating to a linked automation and back. Drafts now live in a
  registry that outlives the card element, so the edit resumes with the
  draft intact. Two cards showing the same remote share the draft.
  (`0c1d255`)
- **Card refreshes after an HA restart** instead of trusting its
  pre-restart data. (`e708545`)
- **Edit-mode taps are the same in every display mode.** In "All visible"
  a chip tap jumped straight to that event's editor and hid the button sheet
  (rename, per-event rows). A tap anywhere on a button now opens the sheet;
  its rows keep their pencils. One extra tap per event edit. (`8e59fb6`)

### Added

- **Reload prompts after install and update.** HA caches custom cards
  until a full reload. Now: a persistent notification whenever the card
  resource is created or re-versioned; inside the card, HA's own confirm
  dialog once per page load plus an amber banner with a Reload button when
  the backend is newer than the bundle; the reload also clears the
  service-worker cache. A bundle newer than the backend says to restart HA
  instead. The bundle carries its version from `package.json`; the backend
  reports its own in `get_remote`. (`35ad4b2`, `99b63b6`, `abf835d`)
- **Honest discard in edit mode.** X is "Discard layout changes", ✓ is
  "Save layout". A dirty draft asks through HA's confirm dialog, whose text
  says event edits are already saved. A third hint line states both save
  rules. (`418f99b`)
- **Preview lock-out.** Inside HA's card-config dialog the pencil is hidden
  and a hint points to the dashboard, because HA's Cancel cannot undo
  server writes made from a preview. (`418f99b`)
- **Clear and Archive ask first.** Clear explains what happens for a
  linked, an imported, or a plain slot (the automation stays in HA;
  imported originals stay disabled and Import can pick them up again).
  Archive explains that nothing is deleted. Unarchive stays one tap.
  (`418f99b`)
- **First-run tips.** Four tips in a banner above the card, one at a time,
  with Next and Skip. Seen once per browser (localStorage). (`418f99b`)

### Changed

- Edit-mode error text for a linked slot now tells you to edit in HA or
  untick "Keep linked" to absorb your changes. (`eca23e9`)

### Internal

- Frontend logic extracted into pure modules with unit tests: version
  comparison, grid draft registry, linked-slot save rule, onboarding tips.
  `happy-dom` added for a component test of the grid's tap semantics.
  Frontend tests 37 → 59, Python tests 105 → 107. (`9ae2f20`, `418f99b`)
- The rollup version stamp now targets `src/version.ts`. (`9ae2f20`)

## 0.1.3 and earlier

See `git log --oneline v0.1.3` and the release notes on GitHub.

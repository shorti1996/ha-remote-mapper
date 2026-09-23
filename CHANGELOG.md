# Changelog

Notable changes per release. Unreleased entries collect on `master` and
move under a version heading when `make release VERSION=x.y.z` runs.

## Unreleased

Since v0.1.3. Python changed, so restart Home Assistant after updating.

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

# Remote Mapper

Home Assistant custom integration (with bundled Lovelace card) that turns
physical remotes (Zigbee/MQTT/…) into first-class dashboard objects: each
remote gets a card mirroring its buttons; each button × event ("slot") can
be assigned an action, executed by the integration or materialized as a
native HA automation. Includes one-tap snapshot-to-scene.

## Features

- **Canvas card** — drag slot tiles once into an arrangement mirroring the
  physical device (long-press or pencil to edit; undo, D-pad nudge,
  resize). Layout persists server-side with the remote, not the dashboard.
- **Slot editor tiers** — quick chips (activate scene / toggle entity /
  run script via native HA pickers), YAML editor for arbitrary sequences
  (full automation-action syntax: `choose`, `if/then`, templates, …).
- **Tap to test** — tapping an assigned tile fires its sequence
  (a dashboard gesture, distinct from the physical button event).
- **Materialize toggle** — per slot: "create as automation". On = the slot
  lives in HA's automation system (native editor, traces, `related`
  search); off = folds the automation (with any external edits) back into
  the card. Mode switch, not export.
- **Snapshot-to-scene** — set the room how you like it, press 📸: current
  states of the remote's entity set become a persistent scene bound to the
  button. Re-snapshot updates the same scene in place.
- **Scene ownership** — only scenes the integration created are ever
  prompted about; one remembered choice (ask/always/never) covers scene
  and automation cleanup.
- **Import assistant** — absorbs existing button automations (one big
  `choose` keyed on trigger ids, or one automation per button) into slots
  losslessly; sources are disabled, never deleted; anything unclassifiable
  is flagged, never dropped.
- **Drift handling** — newly discovered actions are added automatically;
  actions the source stops reporting get a "stale" badge.

## Sources (adapters)

| Adapter | Use for | Enumerates actions? |
|---|---|---|
| **Device triggers** (default) | Z2M, ZHA — any device publishing device triggers | yes (press each button once — Z2M discovery is lazy) |
| Zigbee2MQTT raw topic | Z2M without HA discovery | no (type ids manually) |
| Event entity | `event.*_action` entities (experimental in Z2M) | yes (`event_types`) |
| Generic MQTT | deCONZ, ESPHome, custom firmware | no |

## Installation

HACS → custom repository (category: Integration) → install → restart →
*Settings → Devices & services → Add integration → Remote Mapper*.

With Lovelace in **storage mode** (default) the card resource registers
automatically. In **YAML mode** add it manually:

```yaml
lovelace:
  mode: yaml
  resources:
    - url: /hacsfiles/remote_mapper/remote-mapper-card.js?v=0.1.0
      type: module
```

Card usage: add `custom:remote-mapper-card` (the card has a visual
config editor). With a single remote no config is needed.

```yaml
type: custom:remote-mapper-card
entry_id: …               # optional with one remote
layout: grid              # grid (default) | canvas (legacy free-drag tiles)
display: normal           # grid only: normal | all | assisted
assisted_trigger: auto    # assisted: auto (touch→press, mouse→tap) | tap | press
chips_layout: vertical    # all: vertical | horizontal | grid
button_color: "#3f51b5"   # picker in the editor; YAML takes any CSS color / var()
accent_color: ""          # borders / assigned marks / flashes; empty = primary
text_color: ""
button_opacity: 1         # 0.1 – 1, pad background only (text stays solid)
```

Sizes follow HA's design tokens (`--ha-font-size-*`, `--ha-space-*`,
`--ha-border-radius-*`), so the card scales with the user's font-size
setting and themes. Themes can also set `--remote-mapper-button-color`,
`--remote-mapper-accent-color`, `--remote-mapper-text-color`,
`--remote-mapper-border-color`, `--remote-mapper-button-opacity`.

## Layout & display modes

Actions are grouped into **buttons** server-side (`1_single`/`1_double` →
button `1`; Matter `button_1:multi_press_1` → `button_1`; single-entity
remotes → one button). In edit mode (✎) the ⊞ picker sets the grid shape
like Word's table picker; drag buttons between cells; tap a button to
rename it or edit its events. The grid is saved with the remote, so every
dashboard shows the same arrangement.

`display` is per card instance:

| Mode | Cell shows | Dashboard gesture |
|---|---|---|
| `normal` | label + kind dots | tap → single, double-tap → double, hold → hold (release on lift) — works like the physical remote |
| `all` | every event as a chip | tap a chip |
| `assisted` | label + primary summary | tap → the button's events pop up (tap again closes); or `assisted_trigger: press` — hold, slide onto an event, lift |

## Development

Requirements: [uv](https://docs.astral.sh/uv/) (Python ≥ 3.14.2 fetched
automatically), Node 22+, Docker.

```sh
make dev        # card build (unminified, sourcemaps)
make build      # production card build (output committed in www/)
make test       # pytest (pytest-homeassistant-custom-component)
make lint       # ruff check + format check
make ha-up      # dev HA (stable) + mosquitto on :8123 / :1883
make ha-logs    # follow HA logs
```

`docker/compose.yaml` mounts `custom_components/remote_mapper` read-only
into the dev HA. Simulate a remote against the bundled broker:

```sh
mosquitto_pub -t "homeassistant/device_automation/x/action_1_single/config" -r \
  -m '{"automation_type":"trigger","topic":"zigbee2mqtt/x/action","payload":"1_single","type":"action","subtype":"1_single","device":{"identifiers":["zigbee2mqtt_x"],"name":"X"}}'
mosquitto_pub -t "zigbee2mqtt/x/action" -m "1_single"
```

Live smoke test against a running HA (see `ai/local-ha-testing.md`):
`HA_TOKEN=... MQTT_HOST=... uv run python scripts/e2e_live.py`.

The card's canvas engine is vendored from the in-house widget-canvas
repo (`frontend/src/canvas/`, provenance headers in each file); once that
repo tags a release exporting `src/lib.ts`, the copies collapse into a
pinned npm git dependency.

## Release

```sh
make bump-version VERSION=x.y.z   # syncs manifest, package.json, pyproject, VERSION
git commit ... && git tag vx.y.z && git push --tags
```

The release workflow verifies tag == versions, rebuilds the card,
fails on www/ drift, and attaches the HACS zip.

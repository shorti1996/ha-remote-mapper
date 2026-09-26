# Development

User-facing docs live in [README.md](README.md); this file covers the dev
loop, dev HA, and releases. Outside contributions need the [CLA](CLA.md)
signed (the CLA Assistant bot asks on the first PR); every source file
starts with an `SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0` line.

Requirements: [uv](https://docs.astral.sh/uv/) (Python ≥ 3.14.2 fetched
automatically), Node 22+, Docker.

```sh
make dev        # card build (unminified, sourcemaps)
make build      # production card build (output committed in www/)
make test       # vitest (frontend pure modules) + pytest (integration)
make test-deep  # pytest with 100-seed random walks (~7 min, before a release)
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
UI sizing rules (HA design tokens, components, touch): the manual skill
`/homeassistant-ui-development` from the shared `claude-skills` repo
(`/home/shared/repos/claude-skills`, symlinked into `~/.claude/skills/`).
Browser-level checks (phone viewport, touch, screenshots):
`HA_TOKEN=... python3 scripts/ui_local.py` — a Playwright template; the
doc above also covers restart-vs-rebuild rules, the Chrome extension, and
the production rsync.

`tests/fixtures/z2m_actions.json` holds the action list of every Z2M device
definition with a literal one (417 at zigbee-herdsman-converters
`cde6edc`, 2026-09-22) and the buttons each groups into;
`tests/test_z2m_catalog.py` checks the parser against it. Refresh it from
upstream, or re-group it after a parser change, with
`scripts/z2m_actions.py` (steps in its docstring).

The card's canvas engine is vendored from the in-house widget-canvas
repo (`frontend/src/canvas/`, provenance headers in each file); once that
repo tags a release exporting `src/lib.ts`, the copies collapse into a
pinned npm git dependency.

## Release

One command, from a clean `master`:

```sh
make release VERSION=x.y.z
```

It bumps the version in manifest, package.json, pyproject and VERSION
(`make bump-version` alone does only that), refreshes `uv.lock`, rebuilds
the card into `www/`, runs pytest and vitest, commits
`chore: release vx.y.z`, tags `vx.y.z`, and pushes master + tag to the
`github` remote (and to `origin` if that is a different remote;
`GH_REMOTE=name` overrides).

The tag push starts `.github/workflows/release.yml` on GitHub: it checks
that the tag matches every version file, rebuilds the card and fails on
`www/` drift, zips the integration (runtime files only) and publishes a
GitHub release with generated notes and `remote_mapper.zip` attached.
HACS installs from that asset (`hacs.json`: `zip_release`), so a version
is only installable once the workflow has finished. Watch it under
Actions; if it fails, fix, delete the tag (`git tag -d vx.y.z && git push
github :vx.y.z`) and run `make release` again.

Release notes: HACS shows the GitHub release body and adds its own
version heading, so do not start the notes with one. Edit the generated
notes on GitHub if the commit list needs a summary.

## Frontend tests

HA's own frontend convention: keep logic out of Lit elements, in pure
modules, and unit-test those with Vitest (`frontend/test/`, node
environment, no DOM). Covered: `model.ts` (grid normalize/resize/swap),
`naming.ts` (inferred names), `gestures.ts` (tap/double/hold recognizer,
fake timers), `config.ts`. The elements themselves are exercised in the
dev HA. `npm test` / `npm run test:watch` in `frontend/`.

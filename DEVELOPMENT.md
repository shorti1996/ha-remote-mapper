# Development

User-facing docs live in [README.md](README.md); this file covers the dev
loop, dev HA, and releases.

Requirements: [uv](https://docs.astral.sh/uv/) (Python ≥ 3.14.2 fetched
automatically), Node 22+, Docker.

```sh
make dev        # card build (unminified, sourcemaps)
make build      # production card build (output committed in www/)
make test       # vitest (frontend pure modules) + pytest (integration)
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
Browser-level checks (phone viewport, touch, screenshots):
`HA_TOKEN=... python3 scripts/ui_local.py` — a Playwright template; the
doc above also covers restart-vs-rebuild rules, the Chrome extension, and
the production rsync.

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

## Frontend tests

HA's own frontend convention: keep logic out of Lit elements, in pure
modules, and unit-test those with Vitest (`frontend/test/`, node
environment, no DOM). Covered: `model.ts` (grid normalize/resize/swap),
`naming.ts` (inferred names), `gestures.ts` (tap/double/hold recognizer,
fake timers), `config.ts`. The elements themselves are exercised in the
dev HA. `npm test` / `npm run test:watch` in `frontend/`.

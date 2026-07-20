# Remote Mapper

Home Assistant custom integration (with bundled Lovelace card) that turns
physical remotes (Zigbee/MQTT/…) into first-class dashboard objects: each
remote gets a card mirroring its buttons; each button × event can be assigned
an action, executed by the integration or materialized as a native HA
automation. Includes one-tap snapshot-to-scene.

Status: **M0 — skeleton**. Backend registers a hello-world WebSocket command
(`remote_mapper/ping`) and serves a stub card that performs the handshake.
See `remote-mapper-design.md` and `ai/03-implementation-plan.md` for the full
design and milestone plan.

## Installation

### HACS (custom repository)

Add this repo as a custom repository (category: Integration), install, restart
HA, then add the integration via *Settings → Devices & Services*.

### Lovelace resource

With Lovelace in **storage mode** (default) the card resource is registered
automatically.

With Lovelace in **YAML mode**, add the resource manually:

```yaml
lovelace:
  mode: yaml
  resources:
    - url: /hacsfiles/remote_mapper/remote-mapper-card.js?v=0.1.0
      type: module
```

## Development

Requirements: [uv](https://docs.astral.sh/uv/) (Python ≥ 3.14 fetched
automatically), Node 22+, Docker.

```sh
make dev        # build the card (unminified, sourcemaps)
make build      # production card build (committed to www/)
make test       # pytest (pytest-homeassistant-custom-component)
make lint       # ruff check + format check
make ha-up      # dev HA (stable) + mosquitto on :8123 / :1883
make ha-logs    # follow HA logs
```

`docker/compose.yaml` mounts `custom_components/remote_mapper` read-only into
the dev HA instance. A synthetic remote can be simulated with
`mosquitto_pub -t zigbee2mqtt/test_remote -m '{"action": "1_single"}'` once
the MQTT integration is configured against the bundled broker
(host `mosquitto`, port 1883, anonymous). Optional real Zigbee2MQTT:
`docker compose -f docker/compose.yaml --profile z2m up -d` (adjust the
serial adapter device first).

## Versioning

`make bump-version VERSION=x.y.z` syncs `manifest.json`, the frontend
`package.json`, `pyproject.toml`, and `VERSION`.

# Local HA, browser checks, production deploy

How a Claude Code session (or a human) verifies a change end to end.
Read this before "try it locally".

## The dev HA

- `docker/compose.yaml` runs HA (`docker-homeassistant-1`) + mosquitto.
  `make ha-up` / `make ha-logs`. URL: http://localhost:8123
- `custom_components/remote_mapper` is bind-mounted **read-only** into
  `/config/custom_components/remote_mapper`, so:
  - **Python changes need a container restart**:
    `docker compose -f docker/compose.yaml restart homeassistant`
    (~20 s until `/api/config` answers again).
  - **Card changes need only a build** (`npm run build` in `frontend/`,
    output `www/remote-mapper-card.js` is committed) — the file is served
    live from the mount at `/hacsfiles/remote_mapper/remote-mapper-card.js?v=…`.
    A fresh browser context sees it immediately; an open tab needs a hard
    reload because of the `?v=` cache key.
- Login: user `test` / password `test`. Long-lived access token (also
  works as a bearer for REST and as `hassTokens` in the frontend):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI2ZTU5ZTRmNGE2NTU0ZGJkOGVlZmUxMmE0OTk0NGUwZiIsImlhdCI6MTc4NDU2NzQwOCwiZXhwIjoyMDk5OTI3NDA4fQ.o2SLxI8I0CTxrRF0jzp20wcly3Y3JPpH9AeBzjAx3Aw
```

- Test dashboard: http://localhost:8123/dashboard-test/0 — first section
  has a `custom:remote-mapper-card` without `entry_id` (picks the only
  remote), second section points at a dead entry (shows the error path).
- Test remote: `test/remote4`, an **mqtt_generic** entry (topic
  `test/remote4`, 4 buttons × single/double/hold). Recreate it if gone:

```sh
# config flow via REST: menu → mqtt_generic → topic + actions
python3 - <<'EOF'
import json, urllib.request
T="<token>"; U="http://localhost:8123"
def post(p,b):
    r=urllib.request.Request(U+p,data=json.dumps(b).encode(),headers={"Authorization":"Bearer "+T,"Content-Type":"application/json"})
    return json.load(urllib.request.urlopen(r))
f=post("/api/config/config_entries/flow",{"handler":"remote_mapper"})
f=post(f"/api/config/config_entries/flow/{f['flow_id']}",{"next_step_id":"mqtt_generic"})
f=post(f"/api/config/config_entries/flow/{f['flow_id']}",{"topic":"test/remote4","actions":[f"{b}_{e}" for b in "1234" for e in ("single","double","hold")]})
print(f["type"], f.get("result",{}).get("entry_id"))
EOF
```

  Press a button: `mosquitto_pub -h localhost -t test/remote4 -m 1_single`.
  Per-remote options (default snapshot entities, cleanup policy) go through
  `/api/config/config_entries/options/flow` with `handler: <entry_id>`.
- MQTT integration is installed and points at the bundled broker.

## Browser checks

Two options. Playwright is the one that runs unattended.

### Playwright (python, chromium already installed)

`scripts/ui_local.py` is the template: phone viewport, dark scheme, token
injected via `add_init_script` (no login form), Playwright locators pierce
shadow DOM so `page.locator("remote-mapper-card")` and
`card.locator(".header ha-icon-button:has(ha-icon[icon='mdi:pencil'])")`
just work. Things that bit before:

- `document.querySelector` in `page.evaluate` does **not** pierce shadow
  roots; use locators, or walk `shadowRoot`s manually.
- Touch: `page.touchscreen.tap(x, y)` for taps; for a **long press** send
  CDP `Input.dispatchTouchEvent` touchStart, wait, touchEnd (a pointerdown
  with `pointerType: "touch"` is what the card's long-press code keys on).
- HA's ha-form dropdown items: find by text (`page.get_by_text("…")`) and
  tap their bounding box; element selectors for the menu items are brittle.
- Give the page ~3 s after the card appears before interacting (HA
  finishes loading lazy components).

### Chrome + Claude extension

Works when the user has connected it (`mcp__claude-in-chrome__*`). The
browser must already be logged into the dev HA — Claude must not type the
password itself; ask the user to log in with `test`/`test` if the tab
shows the login page. Use it for looking, use Playwright for scripted
flows.

## Production deploy

Production HA runs on `192.169.1.101`. Deploy = rsync the integration
(bundle included, it is committed) into its config dir, then restart HA
if Python changed:

```sh
rsync -avzP --exclude node_modules --exclude __pycache__ \
  custom_components/remote_mapper \
  root@192.169.1.101:/home/pi/homeassistant-wro/config/custom_components/
```

Only the user deploys to production; a session should stop after the
local verification and offer the command.

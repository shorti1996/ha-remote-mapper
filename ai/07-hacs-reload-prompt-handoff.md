# HACS "reload your browser" prompt: why integration repos never get it, and what to do upstream

Status: investigated and worked around in this repo (commits `35ad4b2`, `99b63b6`,
`e708545`, `abf835d`, 2026-09-23). Nothing filed upstream yet. This doc is for the
session that opens a HACS issue or PR.

## The short version

1. HACS shows its "Reload" confirm dialog only for repos of category `plugin`
   (Dashboard), and only when the download is started from the HACS panel.
   remote_mapper is category `integration`, so it never gets the dialog; it gets
   a "restart required" line instead. Verified against `hacs/frontend`
   `src/components/dialogs/hacs-download-dialog.ts` on 2026-09-23.
2. Updating a Dashboard repo from Settings → Updates (the `update` entity) shows
   no dialog either. `hacs/integration` `custom_components/hacs/update.py` only
   appends "You need to manually clear the frontend cache after updating." to the
   release notes.
3. HA core has no hook that prompts a reload when a Lovelace resource changes.
   Its only prompts are user-initiated: "Reload resources" in YAML resource mode
   (`hui-root.ts`) and resource deletion in Settings → Dashboards → Resources.
4. Integrations that ship a card therefore roll their own. browser_mod, UIX and
   poise-thermostat compare a build-time version against the backend's and fire
   `hass-notification` with a Reload action. remote_mapper now does the same
   plus a persistent notification and HA's confirm dialog (see §5).

## Checked, do not re-investigate

- **`hacs_resources_updated` event.** `hacs/frontend` `src/extra.ts` listens for
  it and shows a toast "[HACS] You need to reload your browser". A code search of
  `hacs/integration` found nothing that fires it, and `frontend.py` only injects
  `iconset.js` through `add_extra_js_url`, not `extra.ts`. Dead code; not a hook
  we can trigger.
- **Changing the repo category.** A `plugin` repo installs only files under
  `www/community/`. The config flow, websocket commands, dispatcher and
  materializer cannot ship that way. The only route to the dialog is a second,
  Dashboard-category repo for the card, which brings version-skew and
  double-install problems and still does not cover Settings → Updates.
- **`window.customCards[].preview`.** Unrelated: it only controls whether the
  card picker renders a live preview.
- **HA's stale-build recovery** (`recover-stale-build`) treats custom resources
  as foreign files; it never reloads them.
- **Plain `location.reload()` is enough for the module cache** once the resource
  URL carries a new `?v=`; clearing Cache Storage (`caches.delete`) is what
  card-mod, UIX and the community guide add on top, and it is cheap, so we do it.

## Why HACS behaves this way

`hacs-download-dialog.ts`, after a successful download:

```ts
if (this._repository.category === "plugin") {
  showConfirmationDialog(this, {
    title: localize("common.reload"),
    text: html`${localize("dialog.reload.description")}<br />${localize("dialog.reload.confirm")}`,
    confirm: () => { mainWindow.location.href = mainWindow.location.href; },
  });
}
```

`showConfirmationDialog` is HA-frontend-internal; HACS can call it because it
compiles HA frontend sources into its own bundle. For an `integration` repo the
same code path renders the restart note. The cache bust itself is separate:
HACS serves `/hacsfiles/` with no-cache headers and registers the resource as
`?hacstag=<id><version>`, rewritten on every update.

## What remote_mapper ships instead (already implemented)

| piece | where | behaviour |
|---|---|---|
| resource re-versioning | `custom_components/remote_mapper/card_resource.py:79-118` | registers `/hacsfiles/remote_mapper/remote-mapper-card.js?v=<manifest version>`, updates the query on version change, returns whether anything changed |
| persistent notification | `card_resource.py:36-60`, id in `const.py:27` | raised when a resource is created or re-versioned; covers first install, where no tab has our JS |
| backend version on the wire | `websocket.py:122` (`ping`), `websocket.py:197` (`get_remote`) | `INTEGRATION_VERSION` from `manifest.json` |
| bundle version | `frontend/src/version.ts`, stamped by `frontend/rollup.config.js:11-16` from `package.json` | `bundleStatus()` → `current` / `stale` / `ahead` |
| in-card prompt | `frontend/src/remote-mapper-card.ts:1968-2045` | stale: HA confirm dialog once per page load (`reloadPrompted`, line 27) plus an amber banner with Reload; ahead: "restart HA" notice; reload clears Cache Storage first (`reloadWithClearedCache`, line 33) |
| refetch on reconnect | `remote-mapper-card.ts:375` | so an open tab notices the new backend version after an HA restart |
| test | `tests/test_init.py:46` | notification on new or changed resource, quiet on same version |

Verified in the dev HA on 2026-09-23: downgrading the registered resource to
`?v=0.0.1` and restarting produced the notification and re-registered `?v=0.1.3`;
faking a `9.9.9` backend on a live card produced the dialog and banner.

## Options for upstream, ranked

| option | what it would take | why it might be accepted | risk |
|---|---|---|---|
| A. HACS issue: show the reload dialog for integration repos that register Lovelace resources | Detect via `hacs.json` (a new key such as `"frontend_resources": true`) or by scanning the repo's `www/` at download time; reuse the existing dialog branch | Small change in one file, matches what HACS already does for plugins | HACS may argue the integration owns the resource and should prompt itself, which is what we do now |
| B. HACS issue: fire the already-listened-for `hacs_resources_updated` event from the backend after a plugin download or update | Backend emits the event where it rewrites the resource; `extra.ts` already renders the toast | Revives existing code; also fixes the Settings → Updates gap for plugins | `extra.ts` may not even be loaded any more; check `frontend.py` first |
| C. HA core: a `lovelace/resources` update event that the frontend turns into a "reload to apply" toast | Frontend PR in `home-assistant/frontend`, backend event in `homeassistant/components/lovelace/resources.py` | Solves it for every integration and for HACS | Largest surface; core may prefer resources to be immutable per session |

Recommendation: file A and B as one HACS issue with both angles; link this repo's
implementation as prior art. Do not start C unless HACS declines.

## How to work

- Card changes: `npm run build` in `custom_components/remote_mapper/frontend`,
  output `www/remote-mapper-card.js` is committed. Tests: `npm test` (59) and
  `uv run pytest -q` (107). Lint: `uv run ruff check .`.
- Dev HA: `ai/local-ha-testing.md`. A rebuilt bundle under the same version is
  still cached by the browser: hard reload, or clear Cache Storage and refetch
  the resource URL before `location.reload()`.
- One-off visual checks: Claude in Chrome. Playwright scripts only when they
  are meant to be committed.
- Only the user deploys to production (rsync in `ai/local-ha-testing.md`).

## Commands that establish state

```sh
# resource URL and notifications on the dev HA (run from the repo root)
python3 - <<'EOF'
import json, asyncio, websockets
T = "<token from ai/local-ha-testing.md>"
async def main():
    async with websockets.connect("ws://localhost:8123/api/websocket") as ws:
        await ws.recv(); await ws.send(json.dumps({"type": "auth", "access_token": T})); await ws.recv()
        await ws.send(json.dumps({"id": 1, "type": "lovelace/resources"}))
        print([x["url"] for x in json.loads(await ws.recv())["result"] if "remote-mapper" in x["url"]])
        await ws.send(json.dumps({"id": 2, "type": "persistent_notification/get"}))
        print([n["notification_id"] for n in json.loads(await ws.recv())["result"]])
asyncio.run(main())
EOF
```

Trap: `lovelace/resources/update` with the same `?v=` does nothing visible, and a
tab that already has the module keeps it until a full reload regardless of what
the resource list says.

## Success criteria for an upstream change

1. Installing or updating an integration repo that ships a Lovelace resource
   from the HACS panel shows the same Reload dialog a Dashboard repo gets.
2. Updating either kind from Settings → Updates shows a reload prompt (toast or
   dialog) in every open tab.
3. remote_mapper's own prompts can then be reduced to the persistent notification
   for first install; the in-card banner stays as a fallback for non-HACS installs.

## Open questions

- Does HACS still load `extra.ts` at all? If not, option B needs a frontend
  change too. Check `hacs/integration` `custom_components/hacs/frontend.py` and
  the built `hacs_frontend` package.
- Would HACS accept a `hacs.json` key for "this integration registers frontend
  resources"? Search their issue tracker for prior requests before filing.
- Is there appetite in HA core for a resources-changed event (option C)? A
  search of `home-assistant/frontend` issues for "reload resources" would show
  whether it was proposed and declined.

## Sources

- hacs/frontend `src/components/dialogs/hacs-download-dialog.ts`, `src/extra.ts`
- hacs/integration `custom_components/hacs/update.py`, `custom_components/hacs/frontend.py`
- home-assistant/frontend `src/panels/lovelace/cards/hui-card.ts` (sets
  `preview`/`editMode`), `src/panels/lovelace/hui-root.ts`,
  `src/panels/lovelace/custom-card-helpers.ts` (`showConfirmationDialog`),
  `src/mixins/notification-mixin.ts`
- thomasloven/hass-browser_mod `js/version.ts`; Lint-Free-Technology/uix `version.ts`;
  thomasloven/lovelace-card-mod `ll-custom-actions.ts` (cache clear)
- HA developer docs, custom card: https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/

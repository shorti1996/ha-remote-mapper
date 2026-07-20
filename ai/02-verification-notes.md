# Remote Mapper — verification notes (context7 + web, July 2026)

Verification pass over the design doc's "§12 Verified API surface" plus the new
claims in the implementation draft. Target: HA **2026.7.2** (current stable,
released 2026-07-10).

## Confirmed ✅

| Claim | Verdict | Evidence |
|---|---|---|
| WS commands: `@websocket_api.websocket_command` + `@async_response`, `async_register_command` in `async_setup` | ✅ current | context7 `/home-assistant/developers.home-assistant` (frontend/extending/websocket-api.md, auth_permissions.md) |
| Static files: `await hass.http.async_register_static_paths([StaticPathConfig(url, path, cache)])` | ✅ current; **old sync `register_static_path` removed 2025.7** → HACS min HA ≥ 2025.7 | dev-docs blog 2024-06-18; esl bumped min for same reason |
| `Store[T]` generic, versioned, `async_load/async_save` | ✅ public, stable (generic since 2022.8) | dev-docs blog 2022-07-08 |
| Config-entry migration: `VERSION`/`MINOR_VERSION` + `async_migrate_entry` | ✅ current | dev-docs config_flow.md |
| Automation/scene config CRUD via REST `/api/config/{automation\|scene}/config/{id}` | ✅ exists, but **semi-official**: used by native UI editor, not formally documented, no stability guarantee. Thin-wrapper strategy correct | [community thread](https://community.home-assistant.io/t/rest-api-docs-for-automations/119997), [REST API docs](https://developers.home-assistant.io/docs/api/rest/) (endpoint absent from official docs) |
| Z2M event entities experimental | ✅ still true 2026: opt-in `homeassistant: {experimental_event_entities: true}`, "may break in the future", open issues (e.g. [#31089](https://github.com/koenkk/zigbee2mqtt/issues/31089), Feb 2026); MQTT-based paths recommended meanwhile | [Z2M HA integration docs](https://www.zigbee2mqtt.io/guide/usage/integrations/home_assistant.html), [discussion #25061](https://github.com/Koenkk/zigbee2mqtt/discussions/25061) |
| Lovelace resource auto-registration from integration | ✅ works, **storage mode only**; needs `dependencies: ["frontend","http"]` + `after_dependencies: ["lovelace"]`; YAML mode → manual resource line | [community dev guide](https://community.home-assistant.io/t/developer-guide-embedded-lovelace-card-in-a-home-assistant-integration/974909), [KipK gist](https://gist.github.com/KipK/3cf706ac89573432803aaa2f5ca40492); working in-house impl: esl `JSModuleRegistration` |

## Drift found — design doc needs updating ⚠️

1. **Automation payload keys are plural.** Design §6 materialize payload uses
   `trigger:/condition:/action:` (singular). Since HA 2024.10 the native editor
   writes `triggers:/conditions:/actions:`; 2026.7 doubles down (purpose-specific
   triggers graduated from Labs, some trigger/condition key renames with "old
   keys no longer work" for the renamed ones). Materializer must emit plural
   keys. ([2026.7 release notes](https://www.home-assistant.io/blog/2026/07/01/release-20267/))
2. **Event-entity adapter trigger.** Design §2 adapter #2 says
   "state-on-attribute" trigger. 2026.7 has purpose-specific triggers expressing
   event-entity events directly — use that for `build_trigger()`; state trigger
   only as fallback pre-2026.7. Verify exact trigger key against dockerized HA
   at implementation (M6).
3. **In-house convention claims.** Design §15 says PHACC + Playwright "per
   existing project conventions" — esl actually uses hand-rolled stubs, has no
   E2E and no HA docker env. These are aspirations (esl `ai/future-plans.md`),
   not conventions. Still the right choice — just greenfield effort, budget
   accordingly.
4. **Widget Canvas reuse assumption.** Design §13 "verify how self-contained the
   canvas component is": answer — not a standalone element; render/DOM baked
   into the card. Reusable engine = `EditController`+`EditHost`, session,
   scaling, zorder, snap helpers. Card layer plan updated accordingly.

## New opportunities (2026.7) 💡

- Integrations can now **contribute custom triggers/conditions** to the
  automation editor. v2 candidate: native `remote_mapper.button` trigger — would
  make materialized automations read naturally and reduce adapter trigger
  branching. Out of v1 scope.
- Event entities got first-class trigger support in the editor — strengthens
  adapter #2's long-term position once Z2M naming stabilizes.

## Round 2 — device triggers (after seeing user's real automations)

User's existing automations use **MQTT device triggers**
(`{trigger: device, domain: mqtt, device_id, type: action, subtype: "1_single"}`),
not raw topics or event entities. Verified:

- Provider side: integrations expose triggers via `device_trigger.py`
  (`async_get_triggers`, `async_attach_trigger`) — [dev docs](https://developers.home-assistant.io/docs/device_automation_trigger/).
  MQTT integration has this ([MQTT device trigger](https://www.home-assistant.io/integrations/device_trigger.mqtt/));
  Z2M publishes the discovery payloads. ZHA likewise.
- Consumer side: `helpers.trigger.async_initialize_triggers` attaches
  arbitrary trigger configs at runtime — the same coroutine the automation
  component uses. Precedent for third-party use: **HomeKit** forwards other
  integrations' device triggers this way.
- Enumeration: `device_automation.async_get_device_automations(hass,
  DeviceAutomationType.TRIGGER, [device_id])` (backs the WS
  `device_automation/trigger/list` the UI uses). Pin exact signature at M1.

Consequence: new primary adapter `device_trigger` — subscribe/build_trigger
use the *same* trigger dict; subsumes zha_event adapter; enables layout
inference from subtype enumeration. Plan v3 §1.4, §5.

## Round 3 — plan-judge audit (4-agent, results folded into plan v4)

Verdict was NO-GO on v3; v4 applies all fixes. HA core source verified locally
at `/home/shared/repos/core` (2026.3-dev checkout) — claims below checked
against source, not docs.

**P0s found:**
1. Config REST endpoints (`/api/config/{automation,scene}/config/{id}`) are
   `@require_admin` HTTP views — **backend integration code cannot call them**
   (no user token). No WS/storage write API exists; the views edit
   `automations.yaml`/`scenes.yaml` + fire targeted reload
   (`config/view.py:87-161`). Materializer redesigned in-process (plan v4
   §1.5). Design doc §6 "sent via REST — verified" corrected in errata.
2. `pytest-homeassistant-custom-component` 0.13.346 (2026-07-11, tracks HA
   2026.7.2) requires **Python ≥ 3.14**. pyproject bumped from 3.13.

**Key API precision (all source-verified):**
- `async_initialize_triggers(...) -> CALLBACK_TYPE | None` — None = all
  attaches failed; errors only via log_cb (`trigger.py:1260-1332`).
- `async_get_device_automations` returns `Mapping[device_id, list]`; raises
  `DeviceNotFound` (`device_automation/__init__.py:234-254`).
- Generic `cv.TRIGGER_SCHEMA` passes garbage device-trigger subtypes; real
  validation = `helpers.trigger.async_validate_trigger_config`.
- Import scan: `automation.automations_with_device(hass, device_id)` +
  entity `raw_config` — no REST needed; normalize legacy singular keys.
- Z2M device-trigger discovery is lazy (per action, after first press) —
  probe returns partial subtype sets; MQTT placeholder trigger makes early
  attach safe (`mqtt/device_trigger.py:399-411`).
- 2026.7 event-entity trigger syntax:
  `{trigger: "event.received", target: {entity_id}, options: {event_type: [...]}}`.
- POST config view auto-reloads via targeted `automation.reload {id}` — our
  in-process writer replicates that call.

## Environment decisions locked

- Dev HA: `ghcr.io/home-assistant/home-assistant:stable` (2026.7.x) in docker
  + mosquitto sidecar; synthetic remote via `mosquitto_pub`. (Greenfield — no
  esl precedent.)
- HACS `homeassistant` min: **"2025.7.0"** (static-path API floor). Event-entity
  purpose-specific trigger feature-detected at runtime, not a floor bump.

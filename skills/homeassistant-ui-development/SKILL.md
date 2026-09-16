---
name: homeassistant-ui-development
description: Sizing, tokens and component rules for custom Home Assistant cards and dialogs so they match HA's own UI scale. Manual only — invoke /homeassistant-ui-development when building or reviewing card UI.
disable-model-invocation: true
---

# Home Assistant UI development (custom cards)

Distilled from ha-remote-mapper (commits e4fe780, 8140867 and the import
dialog fix) and confirmed against HA frontend sources on 2026-09-16.
When in doubt re-verify: the tokens live in
`home-assistant/frontend` → `src/resources/theme/*.globals.ts`
(`typography.globals.ts`, `core.globals.ts`); component changes are
announced in developers.home-assistant "Frontend component updates
YYYY.M" posts (query them via Context7 before using an `ha-*` element).

## The rule that fixes "UI elements look off-scale"

**Never size text or controls in `em`/`px` inside a card.** HA's own
dialogs use tokens, and the user can change `--ha-font-size-scale`; `em`
chains and hard px ignore both, so lists, checkboxes and selects come out
tiny (or huge) next to native HA UI. Use the tokens with px fallbacks
(HA < 2025.x lacks them):

```css
font-size: var(--ha-font-size-m, 14px);
padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
border-radius: var(--ha-border-radius-md, 8px);
```

Canvas-scaled content (things inside a `transform: scale()` viewport) is
the one place `em` is right, because it must scale with the canvas.

## Tokens (values from HA frontend `dev`, 2026-09)

Typography (`--ha-font-size-scale` multiplies all of them, default 1):

| token | value |
|---|---|
| `--ha-font-size-xs` / `-s` / `-m` / `-l` | 10 / 12 / 14 / 16 px |
| `--ha-font-size-xl` / `-2xl` / `-3xl` / `-4xl` / `-5xl` | 20 / 24 / 28 / 32 / 40 px |
| `--ha-font-weight-light/normal/medium/bold` | 300 / 400 / 500 / 700 |
| `--ha-font-weight-body/heading/action` | normal / bold / medium |
| `--ha-line-height-condensed/normal/expanded` | 1.2 / 1.6 / 2 |
| `--ha-font-family-body` / `-code` / `-heading` | Roboto… / monospace / body |

Spacing `--ha-space-1 … 20` = 4px steps (1→4px, 2→8px, 4→16px, 5→20px,
8→32px, 9→36px, 10→40px, 12→48px). Radius `--ha-border-radius-sm/md/lg/
xl` = 4/8/12/16px, `-pill` 9999px, `-circle` 50%. Shadows `--ha-box-shadow-m`
etc. Card header: `--ha-card-header-font-size/-weight/-color/-font-family`.

Which size where (matches HA's entities/tile cards and dialogs):

- body / list rows / form controls: `m`; secondary hints, badges, code: `s`
- dialog title: `xl` + weight medium; card title: `--ha-card-header-*`
- touch targets: min-height `--ha-space-9` (36px) for buttons, `--ha-space-10`
  (40px) for icon buttons; checkboxes `--ha-space-5` (20px) square
- lists: `line-height: var(--ha-line-height-normal)`

Colors: `--primary-text-color`, `--secondary-text-color`, `--divider-color`,
`--card-background-color`, `--secondary-background-color`, `--primary-color`,
`--text-primary-color` (on primary), `--error-color`, `--warning-color`.
Never hard-code a colour without one of these first.

## Native controls inside a shadow root

Native `<input>`, `<select>`, `<button>` do not inherit page fonts. Always:

```css
select, input, button, textarea { font: inherit; color: inherit; }
select, input[type=text] {
  font-size: var(--ha-font-size-m, 14px);
  min-height: var(--ha-space-8, 32px);
  background: var(--card-background-color, inherit);
  border: 1px solid var(--divider-color, #444);
  border-radius: var(--ha-border-radius-md, 8px);
}
input[type=checkbox] {
  width: var(--ha-space-5, 20px); height: var(--ha-space-5, 20px);
  accent-color: var(--primary-color);
}
```

## HA components you can use from a card

- Always defined: `ha-card`, `ha-icon`, `ha-icon-button` (`.label` for
  aria, `title` for the hover tooltip; HA adds no touch tooltip — add a
  long-press one yourself if it matters), `ha-tooltip` (hover only).
- Lazily defined (only after HA loaded a page that uses them):
  `ha-form`, `ha-yaml-editor`, `ha-selector-*`, `ha-entity-picker`. Load
  them the way `frontend/src/canvas/ha-loader.ts` does: check
  `customElements.get()`, else trigger HA's own lazy load and
  `customElements.whenDefined()`, and keep a plain fallback (YAML tab).
- Migration in progress (2026.4–2026.7): `ha-input` replaces
  `ha-textfield`; `ha-checkbox`, `ha-switch`, `ha-textarea` moved to Web
  Awesome with `--ha-checkbox-*` style tokens (MDC tokens are gone);
  `ha-button` sizes are `xs s m l xl`. Do not rely on `--mdc-*` variables.
- Tooltip look: `--ha-tooltip-background-color/text-color/font-size/
  padding/border-radius/box-shadow` with fallbacks (see the `.tip` rule in
  remote-mapper-card.ts).

## Modals and touch

- Fixed overlays inside the card's shadow root: `position: fixed; inset: 0;
  z-index ≥ 30`; a tooltip that must beat them uses `z-index: 1000` (HA's
  own tooltip layer).
- Touch opens modals on pointerup and a synthetic click follows ~immediately:
  swallow clicks for ~350 ms after opening (see `_ghostGuard`).
- Long press on touch ends in contextmenu/pointercancel, not click: hide
  on a timer, `-webkit-touch-callout: none; user-select: none` on the
  pressable, `touch-action: manipulation`.

## Verify

Phone viewport + dark theme in the dev HA (`ai/local-ha-testing.md`,
`scripts/ui_local.py`): compare against a native HA dialog on the same
page. Text in your modal and in HA's dialog must be the same size.

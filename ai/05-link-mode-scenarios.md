# Link mode — the card as a map, HA editors as the workshop

> Write-up requested 2026-09-15 after the navigation buttons (🤖 automation,
> 🎨 scene, 📜 script, robot-off = imported original) made the button →
> source link cheap to find and maintain.

## The idea

Today a slot is one of:

| state | who owns the actions | dispatcher | HA editor |
|---|---|---|---|
| card-built | the slot (store) | runs it | n/a |
| materialized | an automation **we created** | skips | yes, canonical |
| imported | the slot; original **disabled** | runs it | original only, off |

Missing: **linked** — the slot points at an automation (or scene/script)
that already exists and stays native. Nothing disabled, nothing copied.
Technically the materialized path with different ownership: dispatcher
skips, automation is canonical, but we never rename/delete it and it has
no `[remote_mapper]` prefix. Import gains a choice per automation: **Link**
(default) or **Absorb** (today's behavior). Linking a scene/script means the
slot is a one-liner `scene.turn_on` / `script.turn_on` — already supported;
what's new is the picker and the "this is a link, edit it there" framing.

## Scenario 1 — "I already have everything, show me where it is"

Someone with years of automations per button.

1. Add the remote (Z2M full action list → all 18 pads appear).
2. ⇪ Import lists their 13 automations; **Link** is preselected. Apply:
   nothing is disabled, nothing copied.
3. The card fills in. Pad `2` · hold → "4x pilot scenes 2_long" with a live
   🤖 (on/off follows the automation). Tap the pad on the couch to test it.
4. Something needs changing → ✎ → tap the pad → 🤖 opens the automation in
   HA's editor; 🎨 opens the scene it activates. Edit, save. Back on the
   dashboard the name/target already reflect the change (names are inferred
   from the live sequence / friendly names).
5. Rename pads ("Top left"), reorder the grid, set display mode — none of
   that touches an automation.
6. Drift is visible, never silent: linked automation disabled → pad dimmed
   with robot-off; deleted → broken-link badge → relink or clear; two
   automations on one trigger → both listed as links, one pad.
7. They never *have* to use the slot editor. The card is a map.

## Scenario 2 — "New remote, empty buttons"

Someone starting from nothing (or a new remote).

1. Tap an empty event → Quick chip: scene / toggle / script / 📸 snapshot →
   Save. Runs from the card immediately; iterate from the couch.
2. Worth keeping → tick *Create as automation*. It becomes a real automation
   named after the slot ("Kitchen remote · Desk lamp"); the slot becomes
   linked-owned (we created it, so hand-back/cleanup still know it's ours).
3. Needs conditions, a `choose`, traces → 🤖 opens HA's editor. Edits there
   are canonical; the card shows the live summary.
4. Already have an automation/script/scene to bind → **Link existing…** in
   the slot editor: entity picker (automation.* / script.* / scene.*), pick,
   done. Nothing copied.
5. Hand-back later leaves everything as ordinary automations.

## What changes (rough sizing)

1. Slot field `linked_automation_id` (+ `owned: bool` for materialized ones);
   dispatcher skip; get_slot live view for linked (reuse materialized
   code) — ½ day incl. tests.
2. Import: Link/Absorb per row; Link writes the pointer, never disables — ½
   day.
3. Slot editor: "Link existing…" picker; card badges for disabled/missing
   link; naming from the linked automation's alias — ½ day.
4. Materialize → `owned: true` linked slot; hand-back/cleanup keyed on
   `owned` — small.

Absorb stays for people who want the card to be the single source of truth
(and for the "18 automations is too many" pain the project started from).

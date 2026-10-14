// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * First-run tips shown in a banner at the top of the card, one at a time,
 * until the person taps through or skips them. Progress is kept on the
 * server per HA user (remote_mapper/get_prefs, set_prefs), so a cleared
 * browser cache or another device does not start the tour over.
 */

export const TIPS: readonly string[] = [
  "Tap the pencil at the top right of this card to rename buttons and assign actions to their events.",
  "In edit mode, Import picks which of this remote's existing automations the card should manage; Hand back returns them to HA.",
  "Layout, colours and display mode live in the card's settings: open HA's dashboard edit mode and edit this card.",
  "Press a button on the physical remote and its event lights up here. In edit mode, Refresh picks up newly discovered events.",
];

/**
 * Shown once, as a toast, the first time an event mark is dragged: where
 * it can go. Reset together with the tips.
 */
export const DRAG_HINT =
  "Drop it on another event or button to move the action there. With another " +
  "remote's card in edit mode too, drop it on that card to move it to that remote.";

interface PrefsHass {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
}

export interface Prefs {
  tipsSeen: number;
  dragHintSeen: boolean;
  /** The edit-mode help lines are folded away (a chevron in the card). */
  editHelpCollapsed: boolean;
}

/** The remembered choices, from the server. */
export async function loadPrefs(hass: PrefsHass): Promise<Prefs> {
  const res = await hass.callWS<{
    tips_seen: number;
    drag_hint_seen?: boolean;
    edit_help_collapsed?: boolean;
  }>({ type: "remote_mapper/get_prefs" });
  return {
    tipsSeen: clampSeen(res.tips_seen),
    dragHintSeen: !!res.drag_hint_seen,
    editHelpCollapsed: !!res.edit_help_collapsed,
  };
}

/**
 * Fired on window after a pref is saved, with the values that changed, so
 * every card in this window follows at once: the tips are dismissed once,
 * not once per card. Other tabs and devices read the server on load.
 */
export const PREFS_EVENT = "remote_mapper_prefs";

function broadcast(changed: Partial<Prefs>): void {
  try {
    globalThis.dispatchEvent?.(new CustomEvent(PREFS_EVENT, { detail: changed }));
  } catch {
    /* no window (tests) */
  }
}

/** Remember that the drag hint was shown. */
export async function saveDragHintSeen(hass: PrefsHass, seen = true): Promise<void> {
  await hass.callWS({ type: "remote_mapper/set_prefs", drag_hint_seen: seen });
  broadcast({ dragHintSeen: seen });
}

/** Remember whether the edit-mode help is folded away. */
export async function saveEditHelpCollapsed(hass: PrefsHass, collapsed: boolean): Promise<void> {
  await hass.callWS({ type: "remote_mapper/set_prefs", edit_help_collapsed: collapsed });
  broadcast({ editHelpCollapsed: collapsed });
}

/** A stored count, clamped to 0…TIPS.length; junk reads as 0. */
export function clampSeen(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? "0"), 10);
  return Math.min(Math.max(Number.isFinite(n) ? n : 0, 0), TIPS.length);
}

/** The next unseen tip after `seen` tips, or undefined when all were seen. */
export function nextTip(seen: number): { index: number; text: string } | undefined {
  const i = clampSeen(seen);
  return i < TIPS.length ? { index: i, text: TIPS[i] } : undefined;
}

/** How many tips this user has seen, from the server. */
export async function loadTipsSeen(hass: PrefsHass): Promise<number> {
  const res = await hass.callWS<{ tips_seen: number }>({ type: "remote_mapper/get_prefs" });
  return clampSeen(res.tips_seen);
}

/** Remember the count on the server; returns the value stored. */
export async function saveTipsSeen(hass: PrefsHass, seen: number): Promise<number> {
  const value = clampSeen(seen);
  await hass.callWS({ type: "remote_mapper/set_prefs", tips_seen: value });
  broadcast({ tipsSeen: value });
  return value;
}

/** Start the tour over for this user; open cards in this window follow. */
export async function resetTips(hass: PrefsHass): Promise<void> {
  await hass.callWS({
    type: "remote_mapper/set_prefs",
    tips_seen: 0,
    drag_hint_seen: false,
    edit_help_collapsed: false,
  });
  broadcast({ tipsSeen: 0, dragHintSeen: false, editHelpCollapsed: false });
}

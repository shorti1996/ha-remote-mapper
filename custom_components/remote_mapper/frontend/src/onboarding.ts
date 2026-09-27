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

interface PrefsHass {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
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
  return value;
}

/** Fired on window when the tips are reset, so open cards show them again. */
export const TIPS_RESET_EVENT = "remote_mapper_tips_reset";

/** Start the tour over for this user; open cards in this window follow. */
export async function resetTips(hass: PrefsHass): Promise<void> {
  await saveTipsSeen(hass, 0);
  try {
    globalThis.dispatchEvent?.(new Event(TIPS_RESET_EVENT));
  } catch {
    /* no window (tests) */
  }
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * First-run tips shown in a banner at the top of the card, one at a time,
 * until the person taps through or skips them. Progress is per browser
 * (localStorage), which is the right scope: the tips are about this UI.
 */

export const TIPS: readonly string[] = [
  "Tap the pencil at the top right of this card to rename buttons and assign actions to their events.",
  "In edit mode, Import picks which of this remote's existing automations the card should manage; Hand back returns them to HA.",
  "Layout, colours and display mode live in the card's settings: open HA's dashboard edit mode and edit this card.",
  "Press a button on the physical remote and its event lights up here. In edit mode, Refresh picks up newly discovered events.",
];

const KEY = "remote_mapper_tips_seen";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function storage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** How many tips this browser has already seen (clamped to TIPS.length). */
export function tipsSeen(store: StorageLike | undefined = storage()): number {
  try {
    const n = parseInt(store?.getItem(KEY) ?? "0", 10);
    return Math.min(Math.max(Number.isFinite(n) ? n : 0, 0), TIPS.length);
  } catch {
    return 0;
  }
}

/** The next unseen tip, or undefined when all were seen. */
export function nextTip(store?: StorageLike): { index: number; text: string } | undefined {
  const i = tipsSeen(store);
  return i < TIPS.length ? { index: i, text: TIPS[i] } : undefined;
}

function remember(n: number, store: StorageLike | undefined): void {
  try {
    store?.setItem(KEY, String(n));
  } catch {
    /* private window / blocked storage: the tip just shows again next time */
  }
}

/** Mark the current tip as seen. */
export function advanceTip(store: StorageLike | undefined = storage()): void {
  remember(Math.min(tipsSeen(store) + 1, TIPS.length), store);
}

/** Mark every tip as seen. */
export function skipTips(store: StorageLike | undefined = storage()): void {
  remember(TIPS.length, store);
}

/** Fired on window when the tips are reset, so open cards show them again. */
export const TIPS_RESET_EVENT = "remote_mapper_tips_reset";

/** Start the tour over in this browser. */
export function resetTips(store: StorageLike | undefined = storage()): void {
  remember(0, store);
  try {
    globalThis.dispatchEvent?.(new Event(TIPS_RESET_EVENT));
  } catch {
    /* no window (tests) */
  }
}

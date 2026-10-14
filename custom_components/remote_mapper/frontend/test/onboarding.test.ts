// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import {
  clampSeen,
  loadPrefs,
  loadTipsSeen,
  nextTip,
  PREFS_EVENT,
  resetTips,
  saveDragHintSeen,
  saveEditHelpCollapsed,
  saveTipsSeen,
  TIPS,
} from "../src/onboarding";

/** A fake backend: one prefs record, every call logged. */
function backend(tips_seen = 0, drag_hint_seen = false, edit_help_collapsed = false) {
  const calls: Record<string, unknown>[] = [];
  const hass = {
    callWS<T>(msg: Record<string, unknown>): Promise<T> {
      calls.push(msg);
      if (msg.type === "remote_mapper/set_prefs") {
        if ("tips_seen" in msg) tips_seen = msg.tips_seen as number;
        if ("drag_hint_seen" in msg) drag_hint_seen = msg.drag_hint_seen as boolean;
        if ("edit_help_collapsed" in msg) {
          edit_help_collapsed = msg.edit_help_collapsed as boolean;
        }
      }
      return Promise.resolve({ tips_seen, drag_hint_seen, edit_help_collapsed } as T);
    },
  };
  return {
    hass,
    calls,
    seen: () => tips_seen,
    dragSeen: () => drag_hint_seen,
    collapsed: () => edit_help_collapsed,
  };
}

describe("onboarding tips", () => {
  it("walks through every tip once, then stays quiet", () => {
    for (let i = 0; i < TIPS.length; i++) {
      expect(nextTip(i)).toEqual({ index: i, text: TIPS[i] });
    }
    expect(nextTip(TIPS.length)).toBeUndefined();
    expect(nextTip(TIPS.length + 5)).toBeUndefined();
  });

  it("clamps junk and out-of-range counts", () => {
    expect(clampSeen("banana")).toBe(0);
    expect(clampSeen(-3)).toBe(0);
    expect(clampSeen(99)).toBe(TIPS.length);
    expect(clampSeen("2")).toBe(2);
  });

  it("loads and saves the count on the server", async () => {
    const b = backend(2);
    expect(await loadTipsSeen(b.hass)).toBe(2);
    expect(await saveTipsSeen(b.hass, 99)).toBe(TIPS.length);
    expect(b.seen()).toBe(TIPS.length);
    expect(b.calls.map((c) => c.type)).toEqual([
      "remote_mapper/get_prefs",
      "remote_mapper/set_prefs",
    ]);
  });

  it("reset starts the tour over on the server, drag hint and help included", async () => {
    const b = backend(TIPS.length, true, true);
    await resetTips(b.hass);
    expect(b.seen()).toBe(0);
    expect(b.dragSeen()).toBe(false);
    expect(b.collapsed()).toBe(false);
    expect(nextTip(await loadTipsSeen(b.hass))).toEqual({ index: 0, text: TIPS[0] });
  });

  it("keeps the drag hint flag next to the tips, one key at a time", async () => {
    const b = backend(2);
    expect(await loadPrefs(b.hass)).toEqual({
      tipsSeen: 2,
      dragHintSeen: false,
      editHelpCollapsed: false,
    });
    await saveDragHintSeen(b.hass);
    expect(await loadPrefs(b.hass)).toEqual({
      tipsSeen: 2,
      dragHintSeen: true,
      editHelpCollapsed: false,
    });
    const set = b.calls.find((c) => c.type === "remote_mapper/set_prefs");
    expect(set).toEqual({ type: "remote_mapper/set_prefs", drag_hint_seen: true });
  });

  it("folds the edit-mode help away per user, and back", async () => {
    const b = backend(2);
    await saveEditHelpCollapsed(b.hass, true);
    expect(b.collapsed()).toBe(true);
    expect((await loadPrefs(b.hass)).editHelpCollapsed).toBe(true);
    await saveEditHelpCollapsed(b.hass, false);
    expect(b.collapsed()).toBe(false);
    const sets = b.calls.filter((c) => c.type === "remote_mapper/set_prefs");
    expect(sets).toEqual([
      { type: "remote_mapper/set_prefs", edit_help_collapsed: true },
      { type: "remote_mapper/set_prefs", edit_help_collapsed: false },
    ]);
  });

  it("tells every card in the window what was saved", async () => {
    const got: unknown[] = [];
    const listen = (e: Event) => got.push((e as CustomEvent).detail);
    window.addEventListener(PREFS_EVENT, listen);
    try {
      const b = backend(1);
      await saveTipsSeen(b.hass, 2);
      await saveDragHintSeen(b.hass);
      await saveEditHelpCollapsed(b.hass, true);
      await resetTips(b.hass);
    } finally {
      window.removeEventListener(PREFS_EVENT, listen);
    }
    expect(got).toEqual([
      { tipsSeen: 2 },
      { dragHintSeen: true },
      { editHelpCollapsed: true },
      { tipsSeen: 0, dragHintSeen: false, editHelpCollapsed: false },
    ]);
  });

  it("reads an older backend without the flag as not seen", async () => {
    const hass = { callWS: <T>() => Promise.resolve({ tips_seen: 1 } as T) };
    expect(await loadPrefs(hass)).toEqual({
      tipsSeen: 1,
      dragHintSeen: false,
      editHelpCollapsed: false,
    });
  });
});

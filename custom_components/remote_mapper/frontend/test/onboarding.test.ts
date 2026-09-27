// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  clampSeen,
  loadTipsSeen,
  nextTip,
  resetTips,
  saveTipsSeen,
  TIPS,
} from "../src/onboarding";

/** A fake backend: one prefs record, every call logged. */
function backend(tips_seen = 0) {
  const calls: Record<string, unknown>[] = [];
  const hass = {
    callWS<T>(msg: Record<string, unknown>): Promise<T> {
      calls.push(msg);
      if (msg.type === "remote_mapper/set_prefs") tips_seen = msg.tips_seen as number;
      return Promise.resolve({ tips_seen } as T);
    },
  };
  return { hass, calls, seen: () => tips_seen };
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

  it("reset starts the tour over on the server", async () => {
    const b = backend(TIPS.length);
    await resetTips(b.hass);
    expect(b.seen()).toBe(0);
    expect(nextTip(await loadTipsSeen(b.hass))).toEqual({ index: 0, text: TIPS[0] });
  });
});

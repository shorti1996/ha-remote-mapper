// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { advanceTip, nextTip, skipTips, TIPS, tipsSeen } from "../src/onboarding";

function memory() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v) };
}

describe("onboarding tips", () => {
  it("walks through every tip once, then stays quiet", () => {
    const store = memory();
    for (let i = 0; i < TIPS.length; i++) {
      expect(nextTip(store)).toEqual({ index: i, text: TIPS[i] });
      advanceTip(store);
    }
    expect(nextTip(store)).toBeUndefined();
    advanceTip(store);
    expect(tipsSeen(store)).toBe(TIPS.length);
  });

  it("skip ends the tour", () => {
    const store = memory();
    skipTips(store);
    expect(nextTip(store)).toBeUndefined();
  });

  it("survives junk in storage and no storage at all", () => {
    const store = memory();
    store.setItem("remote_mapper_tips_seen", "banana");
    expect(nextTip(store)?.index).toBe(0);
    expect(nextTip(undefined)?.index).toBe(0);
    advanceTip(undefined);
  });
});

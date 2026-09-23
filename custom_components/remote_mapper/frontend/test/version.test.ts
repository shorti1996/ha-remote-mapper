// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { bundleStatus, CARD_VERSION, compareVersions } from "../src/version";

describe("compareVersions", () => {
  it("orders numerically, not lexically", () => {
    expect(compareVersions("0.1.3", "0.1.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "0.9.9")).toBeGreaterThan(0);
    expect(compareVersions("0.2", "0.2.0")).toBe(0);
  });

  it("treats junk segments as zero", () => {
    expect(compareVersions("0.1.x", "0.1.0")).toBe(0);
  });
});

describe("bundleStatus", () => {
  it("is current when versions match or nothing to compare", () => {
    expect(bundleStatus("0.1.3", "0.1.3")).toBe("current");
    expect(bundleStatus("0.1.3", undefined)).toBe("current");
  });

  it("never nags from an unbuilt bundle", () => {
    expect(CARD_VERSION.startsWith("__")).toBe(true);
    expect(bundleStatus(CARD_VERSION, "9.9.9")).toBe("current");
  });

  it("is stale when the backend is newer, ahead when the bundle is", () => {
    expect(bundleStatus("0.1.3", "0.1.4")).toBe("stale");
    expect(bundleStatus("0.2.0", "0.1.9")).toBe("ahead");
  });
});

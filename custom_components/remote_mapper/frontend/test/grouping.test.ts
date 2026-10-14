// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { isOverride, kindOptions, moveTargets } from "../src/grouping";
import { KIND_ICON, type ButtonModel, type GridLayout } from "../src/model";

const buttons: ButtonModel[] = [
  { id: "on", label: "on", actions: [{ action_id: "on", event: "press", kind: "single" }] },
  { id: "off", label: "off", actions: [{ action_id: "off", event: "press", kind: "single" }] },
  {
    id: "arrow_left",
    label: "arrow_left",
    actions: [{ action_id: "arrow_left_click", event: "click", kind: "single" }],
  },
];

const layout: GridLayout = {
  schema_version: 1,
  rows: 2,
  cols: 2,
  buttons: {
    on: { row: 0, col: 1 },
    off: { row: 1, col: 1, label: "Bottom" },
    arrow_left: { row: 0, col: 0 },
  },
};

describe("kindOptions", () => {
  it("lists the six kinds with their text mark", () => {
    const opts = kindOptions();
    expect(opts.map((o) => o.kind)).toEqual([
      "single",
      "double",
      "triple",
      "hold",
      "release",
      "other",
    ]);
    expect(opts[0].label).toBe("1 single press");
    expect(opts[3].label).toBe("⧗ hold");
  });

  it("drops an mdi: mark from the option text", () => {
    const opts = kindOptions({ ...KIND_ICON, single: "mdi:gesture-tap" });
    expect(opts[0].label).toBe("single press");
    expect(opts[1].label).toBe("2 double press");
  });
});

describe("moveTargets", () => {
  it("lists the other buttons in reading order, labelled", () => {
    expect(moveTargets(buttons, layout, "on")).toEqual([
      { id: "arrow_left", label: "arrow_left" },
      { id: "off", label: "Bottom" },
    ]);
  });

  it("puts an unplaced button last", () => {
    const extra: ButtonModel = { id: "new", label: "new", actions: [] };
    const ids = moveTargets([...buttons, extra], layout, "off").map((t) => t.id);
    expect(ids).toEqual(["arrow_left", "on", "new"]);
  });
});

describe("isOverride", () => {
  it("is true only for actions in the grouping map", () => {
    expect(isOverride(undefined, "on")).toBe(false);
    expect(isOverride({}, "on")).toBe(false);
    expect(isOverride({ on: { button: "top" } }, "on")).toBe(true);
  });
});

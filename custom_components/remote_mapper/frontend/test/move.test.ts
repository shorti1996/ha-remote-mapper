// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import type { ButtonModel, GridLayout } from "../src/model";
import { dropTargetFor, moveGroups, moveTargetLabel } from "../src/move";
import type { SlotView } from "../src/remote-grid";

const buttons: ButtonModel[] = [
  {
    id: "1",
    label: "1",
    actions: [
      { action_id: "1_single", event: "single", kind: "single" },
      { action_id: "1_double", event: "double", kind: "double" },
    ],
  },
  {
    id: "2",
    label: "2",
    actions: [{ action_id: "2_single", event: "single", kind: "single" }],
  },
];

const layout: GridLayout = {
  schema_version: 1,
  rows: 1,
  cols: 2,
  // button 2 sits left of button 1
  buttons: { "1": { row: 0, col: 1 }, "2": { row: 0, col: 0, label: "Left" } },
};

const view = (summary: string): SlotView => ({
  assigned: true,
  archived: false,
  summary,
  error: null,
  stale: false,
});

describe("moveGroups", () => {
  it("lists every other event, grouped by button in layout order", () => {
    const groups = moveGroups(buttons, layout, {}, "1_single");
    expect(groups.map((g) => g.label)).toEqual(["Left", "1"]);
    expect(groups[0].targets.map((t) => t.actionId)).toEqual(["2_single"]);
    expect(groups[1].targets.map((t) => t.actionId)).toEqual(["1_double"]);
  });

  it("marks set targets with what they would swap with", () => {
    const slots = { "1_double": view("Lamp"), "2_single": view("Fan") };
    const groups = moveGroups(buttons, layout, slots, "1_single");
    const byId = Object.fromEntries(groups.flatMap((g) => g.targets).map((t) => [t.actionId, t]));
    expect(byId["1_double"]).toMatchObject({ swapWith: "Lamp" });
    expect(byId["2_single"]).toMatchObject({ swapWith: "Fan" });
  });

  it("drops a button whose only event is the current one", () => {
    const groups = moveGroups(buttons, layout, {}, "2_single");
    expect(groups.map((g) => g.buttonId)).toEqual(["1"]);
  });
});

describe("dropTargetFor", () => {
  const source = { actionId: "1_single", kind: "single" as const };

  it("takes a mark or chip as the target", () => {
    expect(dropTargetFor({ actionId: "1_double" }, source, buttons, new Set())).toBe("1_double");
  });

  it("maps a pad to the same kind of event on that button", () => {
    expect(dropTargetFor({ buttonId: "2" }, source, buttons, new Set())).toBe("2_single");
    expect(
      dropTargetFor({ buttonId: "2" }, { actionId: "1_double", kind: "double" }, buttons, new Set())
    ).toBeUndefined();
  });

  it("refuses the source itself and nothing", () => {
    expect(dropTargetFor({ actionId: "1_single" }, source, buttons)).toBeUndefined();
    expect(dropTargetFor({ buttonId: "1" }, source, buttons)).toBeUndefined();
    expect(dropTargetFor({}, source, buttons)).toBeUndefined();
  });
});

describe("moveTargetLabel", () => {
  it("names the event or the swap partner", () => {
    expect(moveTargetLabel({ actionId: "a", event: "hold" })).toBe("hold");
    expect(moveTargetLabel({ actionId: "a", event: "hold", swapWith: "Lamp" })).toBe(
      'hold — swap with "Lamp"'
    );
  });
});

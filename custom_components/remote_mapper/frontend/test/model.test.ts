// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";

import {
  autoDims,
  buttonAt,
  buttonLabel,
  normalizeGrid,
  resizeGrid,
  setButtonLabel,
  swapCells,
  trimLabels,
  type ButtonModel,
  type GridLayout,
} from "../src/model";

const btn = (id: string): ButtonModel => ({
  id,
  label: id,
  actions: [{ action_id: `${id}_single`, event: "single", kind: "single" }],
});
const six = ["1", "2", "3", "4", "5", "6"].map(btn);

describe("autoDims", () => {
  it("prefers two columns up to six buttons", () => {
    expect(autoDims(1)).toEqual({ rows: 1, cols: 1 });
    expect(autoDims(2)).toEqual({ rows: 1, cols: 2 });
    expect(autoDims(4)).toEqual({ rows: 2, cols: 2 });
    expect(autoDims(6)).toEqual({ rows: 3, cols: 2 });
  });
  it("goes square beyond six", () => {
    expect(autoDims(9)).toEqual({ rows: 3, cols: 3 });
    expect(autoDims(10)).toEqual({ rows: 3, cols: 4 });
  });
});

describe("normalizeGrid", () => {
  it("places every button once in reading order when nothing is stored", () => {
    const g = normalizeGrid(null, six);
    expect(g).toMatchObject({ rows: 3, cols: 2 });
    expect(Object.keys(g.buttons)).toHaveLength(6);
    expect(g.buttons["1"]).toEqual({ row: 0, col: 0 });
    expect(g.buttons["6"]).toEqual({ row: 2, col: 1 });
  });

  it("keeps stored positions and labels, drops buttons that no longer exist", () => {
    const stored: GridLayout = {
      schema_version: 1,
      rows: 3,
      cols: 2,
      buttons: {
        "1": { row: 2, col: 1, label: "Top" },
        gone: { row: 0, col: 0 },
      },
    };
    const g = normalizeGrid(stored, six);
    expect(g.buttons["1"]).toEqual({ row: 2, col: 1, label: "Top" });
    expect(g.buttons.gone).toBeUndefined();
    // the freed (0,0) cell is reused by the first unplaced button
    expect(g.buttons["2"]).toEqual({ row: 0, col: 0 });
  });

  it("re-flows out-of-range or colliding positions and grows rows when full", () => {
    const stored: GridLayout = {
      schema_version: 1,
      rows: 1,
      cols: 2,
      buttons: { "1": { row: 5, col: 0 }, "2": { row: 0, col: 0 }, "3": { row: 0, col: 0 } },
    };
    const g = normalizeGrid(stored, six);
    expect(g.cols).toBe(2);
    expect(g.rows).toBe(3); // 6 buttons need 3 rows of 2
    const cells = new Set(Object.values(g.buttons).map((p) => `${p.row},${p.col}`));
    expect(cells.size).toBe(6);
    expect(g.buttons["2"]).toEqual({ row: 0, col: 0 }); // first claim wins
  });

  it("keeps a label override even when the button had to be re-placed", () => {
    const stored: GridLayout = {
      schema_version: 1,
      rows: 1,
      cols: 1,
      buttons: { "3": { row: 9, col: 9, label: "Fan" } },
    };
    expect(normalizeGrid(stored, six).buttons["3"].label).toBe("Fan");
  });
});

describe("resizeGrid / swapCells / labels", () => {
  it("resize keeps in-range buttons put and re-flows the rest", () => {
    const g = normalizeGrid(null, six); // 3×2
    const wide = resizeGrid(g, 2, 3, six);
    expect(wide).toMatchObject({ rows: 2, cols: 3 });
    expect(wide.buttons["1"]).toEqual({ row: 0, col: 0 });
    expect(wide.buttons["2"]).toEqual({ row: 0, col: 1 });
    expect(Object.keys(wide.buttons)).toHaveLength(6);
  });

  it("swap exchanges occupants, move into an empty cell just moves", () => {
    const g = normalizeGrid(null, six);
    const swapped = swapCells(g, { row: 0, col: 0 }, { row: 2, col: 1 });
    expect(buttonAt(swapped, 0, 0)).toBe("6");
    expect(buttonAt(swapped, 2, 1)).toBe("1");
    const bigger = resizeGrid(g, 4, 2, six);
    const moved = swapCells(bigger, { row: 0, col: 0 }, { row: 3, col: 1 });
    expect(buttonAt(moved, 3, 1)).toBe("1");
    expect(buttonAt(moved, 0, 0)).toBeUndefined();
    expect(swapCells(g, { row: 0, col: 0 }, { row: 0, col: 0 })).toBe(g);
  });

  it("label override is kept as typed, trimmed on save, cleared when blank", () => {
    const g = normalizeGrid(null, six);
    const named = setButtonLabel(g, "1", "Lamp ");
    expect(buttonLabel(six[0], named)).toBe("Lamp ");
    expect(trimLabels(named).buttons["1"].label).toBe("Lamp");
    expect(buttonLabel(six[0], setButtonLabel(named, "1", "   "))).toBe("1");
    expect(trimLabels(setButtonLabel(named, "1", "  ")).buttons["1"].label).toBeUndefined();
  });
});

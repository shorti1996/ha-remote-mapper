// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { clearGridDraft, getGridDraft, setGridDraft } from "../src/grid-drafts";
import type { GridLayout } from "../src/model";

const layout: GridLayout = { schema_version: 1, rows: 1, cols: 1, buttons: {} };

describe("grid drafts", () => {
  it("keeps a draft per entry until cleared", () => {
    setGridDraft("a", layout);
    expect(getGridDraft("a")).toBe(layout);
    expect(getGridDraft("b")).toBeUndefined();
    clearGridDraft("a");
    expect(getGridDraft("a")).toBeUndefined();
  });

  it("ignores an unresolved entry id", () => {
    setGridDraft(undefined, layout);
    expect(getGridDraft(undefined)).toBeUndefined();
    clearGridDraft(undefined);
  });

  it("returns the latest draft after several updates", () => {
    const next = { ...layout, rows: 2 };
    setGridDraft("a", layout);
    setGridDraft("a", next);
    expect(getGridDraft("a")).toBe(next);
    clearGridDraft("a");
  });
});

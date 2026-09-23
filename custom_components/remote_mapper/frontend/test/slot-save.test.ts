// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { LINKED_EDIT_BLOCKED, linkedSaveBlocker } from "../src/slot-save";

const live = [{ action: "light.turn_on", target: { entity_id: "light.a" } }];
const base = { linked: true, keepLinked: true, live };

describe("linkedSaveBlocker", () => {
  it("lets unlinked or absorbing saves through", () => {
    expect(
      linkedSaveBlocker({ ...base, linked: false, tab: "yaml", quickMode: "scene", draft: [] })
    ).toBeNull();
    expect(
      linkedSaveBlocker({ ...base, keepLinked: false, tab: "yaml", quickMode: "scene", draft: [] })
    ).toBeNull();
  });

  it("allows re-linking from the Quick tab, refuses any other quick action", () => {
    expect(linkedSaveBlocker({ ...base, tab: "quick", quickMode: "link", draft: null })).toBeNull();
    expect(linkedSaveBlocker({ ...base, tab: "quick", quickMode: "scene", draft: null })).toBe(
      LINKED_EDIT_BLOCKED
    );
  });

  it("allows untouched YAML (name-only save), refuses edited YAML", () => {
    const untouched = JSON.parse(JSON.stringify(live)) as unknown[];
    expect(linkedSaveBlocker({ ...base, tab: "yaml", quickMode: "link", draft: untouched })).toBeNull();
    expect(linkedSaveBlocker({ ...base, tab: "yaml", quickMode: "link", draft: [] })).toBe(
      LINKED_EDIT_BLOCKED
    );
  });

  it("refuses unparseable textarea YAML rather than guessing", () => {
    expect(linkedSaveBlocker({ ...base, tab: "yaml", quickMode: "link", draft: null })).toBe(
      LINKED_EDIT_BLOCKED
    );
  });
});

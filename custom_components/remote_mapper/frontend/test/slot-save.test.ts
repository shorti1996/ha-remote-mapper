// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  LINKED_EDIT_BLOCKED,
  absorbsOnSave,
  disableConfirm,
  linkedSaveBlocker,
  wholeAbsorbConfirm,
} from "../src/slot-save";

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

describe("absorbsOnSave", () => {
  it("absorbs only a linked slot whose 'Keep linked' box is unticked", () => {
    expect(absorbsOnSave({ linked: true, keepLinked: false })).toBe(true);
    expect(absorbsOnSave({ linked: true, keepLinked: true })).toBe(false);
    expect(absorbsOnSave({ linked: false, keepLinked: false })).toBe(false);
  });
});

describe("wholeAbsorbConfirm", () => {
  it("asks only when the automation runs more than this event", () => {
    expect(wholeAbsorbConfirm("Pilot", ["1 single"])).toBeNull();
    const dialog = wholeAbsorbConfirm("Pilot", ["1 single", "1 double"]);
    expect(dialog?.confirmText).toBe("Move all 2");
    expect(dialog?.text).toContain("1 single, 1 double");
    expect(dialog?.text).toContain("turned off");
  });
});

describe("disableConfirm", () => {
  it("names every event a shared automation takes down with it", () => {
    const dialog = disableConfirm("Lamp", {
      automation: true,
      alias: "Pilot",
      linked: ["1 single", "1 double"],
    });
    expect(dialog.title).toBe("Disable 2 events?");
    expect(dialog.confirmText).toBe("Disable all 2");
    expect(dialog.text).toContain("1 single, 1 double");
  });

  it("stays short for one event", () => {
    expect(disableConfirm("Lamp", { automation: false })).toEqual({
      title: "Disable this event?",
      text: '"Lamp" keeps its setup but stops running until you enable it again. Nothing is deleted.',
      confirmText: "Disable",
    });
    expect(disableConfirm("Lamp", { automation: true, linked: ["1 single"] }).text).toContain(
      "Its automation is turned off"
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  applyEditorValue,
  AUTO_REMOTE,
  editorValue,
  trimConfigStrings,
  assistedTriggerOf,
  chipsLayoutOf,
  displayOf,
  hexToRgb,
  layoutOf,
  rgbToHex,
  styleVarsOf,
} from "../src/config";

describe("config parsing", () => {
  it("falls back to defaults for unknown values", () => {
    expect(displayOf({ type: "x", display: "nope" as never })).toBe("normal");
    expect(layoutOf({ type: "x" })).toBe("grid");
    expect(layoutOf({ type: "x", layout: "canvas" })).toBe("canvas");
    expect(assistedTriggerOf({ type: "x" })).toBe("auto");
    expect(assistedTriggerOf({ type: "x", assisted_trigger: "press" })).toBe("press");
    expect(chipsLayoutOf({ type: "x", chips_layout: "spines" })).toBe("spines");
    expect(chipsLayoutOf({ type: "x", chips_layout: "diagonal" as never })).toBe("vertical");
  });

  it("emits only the CSS vars that are set; opacity 1 is omitted", () => {
    expect(styleVarsOf({ type: "x" })).toBe("");
    expect(
      styleVarsOf({ type: "x", button_color: " #112233 ", accent_color: "var(--x)", button_opacity: 0.5 })
    ).toBe("--rm-button-bg:#112233;--rm-accent:var(--x);--rm-opacity:0.5");
    expect(styleVarsOf({ type: "x", button_opacity: 1 })).toBe("");
  });

  it("hex ↔ rgb round-trips and rejects other strings", () => {
    expect(hexToRgb("#3f51b5")).toEqual([63, 81, 181]);
    expect(hexToRgb("var(--primary-color)")).toBeUndefined();
    expect(rgbToHex([63, 81, 181])).toBe("#3f51b5");
    expect(rgbToHex([300, -1, 5])).toBe("#ff0005");
    expect(rgbToHex("nope")).toBeUndefined();
  });
});

describe("trimConfigStrings (on blur)", () => {
  it("trims title and colors, drops blank ones, returns same object when clean", () => {
    const cfg = { type: "x", title: "Desk ", accent_color: " #010203", text_color: "  " };
    expect(trimConfigStrings(cfg)).toEqual({ type: "x", title: "Desk", accent_color: "#010203" });
    const clean = { type: "x", title: "Desk" };
    expect(trimConfigStrings(clean)).toBe(clean);
  });
});

describe("editor round-trip", () => {
  const base = { type: "custom:remote-mapper-card", grid_options: { columns: 6 } };

  it("form shows defaults for an empty config", () => {
    const v = editorValue(base);
    expect(v).toMatchObject({
      entry_id: AUTO_REMOTE,
      title: "",
      show_title: true,
      layout: "grid",
      display: "normal",
      assisted_trigger: "auto",
      chips_layout: "vertical",
      button_color_set: false,
      button_opacity: 1,
    });
  });

  it("defaults are dropped, title kept as typed, foreign keys preserved", () => {
    const next = applyEditorValue(base, {
      ...editorValue(base),
      title: "Desk ",
      show_title: true,
      display: "normal",
      button_opacity: 1,
    });
    expect(next).toEqual({ ...base, title: "Desk " });
    expect(applyEditorValue(next, { ...editorValue(next), title: "   " })).toEqual(base);
  });

  it("non-defaults are written, and clearing them removes the keys", () => {
    const on = applyEditorValue(base, {
      ...editorValue(base),
      entry_id: "abc",
      show_title: false,
      layout: "canvas",
      display: "assisted",
      assisted_trigger: "press",
      chips_layout: "spines",
      button_opacity: 0.4,
    });
    expect(on).toEqual({
      ...base,
      entry_id: "abc",
      show_title: false,
      layout: "canvas",
      display: "assisted",
      assisted_trigger: "press",
      chips_layout: "spines",
      button_opacity: 0.4,
    });
    const off = applyEditorValue(on, { ...editorValue(on), entry_id: AUTO_REMOTE, show_title: true, layout: "grid", display: "normal", assisted_trigger: "auto", chips_layout: "vertical", button_opacity: 1 });
    expect(off).toEqual(base);
  });

  it("color switch on seeds a color, picker value is stored as hex, switch off clears", () => {
    const seeded = applyEditorValue(base, { ...editorValue(base), accent_color_set: true });
    expect(seeded.accent_color).toBe("#3f51b5");
    const picked = applyEditorValue(seeded, {
      ...editorValue(seeded),
      accent_color_set: true,
      accent_color: [1, 2, 3],
    });
    expect(picked.accent_color).toBe("#010203");
    expect(editorValue(picked).accent_color).toEqual([1, 2, 3]);
    // a YAML-only value (theme var) survives the switch staying on
    const yaml = { ...base, button_color: "var(--x)" };
    expect(applyEditorValue(yaml, { ...editorValue(yaml), button_color_set: true }).button_color).toBe("var(--x)");
    const cleared = applyEditorValue(picked, { ...editorValue(picked), accent_color_set: false });
    expect(cleared.accent_color).toBeUndefined();
  });
});

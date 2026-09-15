import { describe, expect, it } from "vitest";

import {
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

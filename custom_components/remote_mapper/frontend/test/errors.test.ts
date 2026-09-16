// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { errorText } from "../src/errors";

describe("errorText", () => {
  it("unwraps hass.callWS error objects instead of [object Object]", () => {
    expect(errorText({ code: "invalid_sequence", message: "YAML is not valid" })).toBe(
      "YAML is not valid"
    );
  });

  it("points a dead entry_id at the card editor", () => {
    const text = errorText({ code: "not_found", message: "Unknown remote" });
    expect(text).toContain("Unknown remote");
    expect(text).toContain("card editor");
  });

  it("handles Errors, strings and junk", () => {
    expect(errorText(new Error("boom"))).toBe("boom");
    expect(errorText("plain")).toBe("plain");
    expect(errorText({ weird: 1 })).toBe('{"weird":1}');
    expect(errorText(undefined)).toBe("undefined");
  });
});

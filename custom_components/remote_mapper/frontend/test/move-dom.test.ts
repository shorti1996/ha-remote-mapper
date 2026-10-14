// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { hostOf } from "../src/move";

/** <outer> ⊃ shadow ⊃ <inner> ⊃ shadow ⊃ <span> — HA's layered cards. */
function nested(): { outer: HTMLElement; inner: HTMLElement; leaf: HTMLElement } {
  const outer = document.createElement("x-outer");
  const inner = document.createElement("x-inner");
  const leaf = document.createElement("span");
  outer.attachShadow({ mode: "open" }).append(inner);
  inner.attachShadow({ mode: "open" }).append(leaf);
  document.body.append(outer);
  return { outer, inner, leaf };
}

describe("hostOf", () => {
  it("finds the nearest host that passes the test, then outer ones", () => {
    const { outer, inner, leaf } = nested();
    const isInner = (h: Element): h is HTMLElement => h.tagName === "X-INNER";
    const isOuter = (h: Element): h is HTMLElement => h.tagName === "X-OUTER";
    expect(hostOf(leaf, isInner)).toBe(inner);
    expect(hostOf(leaf, isOuter)).toBe(outer);
  });

  it("gives up at the document", () => {
    const { leaf } = nested();
    expect(hostOf(leaf, (h): h is HTMLElement => h.tagName === "X-NONE")).toBeUndefined();
    expect(hostOf(document.body, (): boolean => true as never)).toBeUndefined();
    expect(hostOf(null, (): boolean => true as never)).toBeUndefined();
  });
});

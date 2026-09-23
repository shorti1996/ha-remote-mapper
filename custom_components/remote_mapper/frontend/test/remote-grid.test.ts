// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// @vitest-environment happy-dom
/**
 * Tap semantics of <remote-mapper-grid>, the part that keeps changing:
 * which event a pointer sequence emits in each display mode, in edit
 * mode and on the dashboard.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import "../src/remote-grid";
import type { RemoteMapperGrid, SlotView } from "../src/remote-grid";
import { normalizeGrid, type ButtonModel } from "../src/model";

const buttons: ButtonModel[] = ["1", "2"].map((id) => ({
  id,
  label: id,
  actions: [
    { action_id: `${id}_single`, event: "single", kind: "single" },
    { action_id: `${id}_double`, event: "double", kind: "double" },
  ],
}));
const layout = normalizeGrid(undefined, buttons);
const slot = (assigned: boolean): SlotView => ({
  assigned,
  archived: false,
  summary: assigned ? "Lamp" : "unassigned",
  error: null,
  stale: false,
});
const slots: Record<string, SlotView> = {
  "1_single": slot(true),
  "1_double": slot(false),
  "2_single": slot(true),
  "2_double": slot(true),
};

let grid: RemoteMapperGrid;
const events: Array<{ type: string; detail: Record<string, unknown> }> = [];

async function mount(props: Partial<RemoteMapperGrid>): Promise<void> {
  grid = document.createElement("remote-mapper-grid") as RemoteMapperGrid;
  Object.assign(grid, { buttons, layout, slots }, props);
  for (const type of ["run-action", "open-button", "layout-changed"]) {
    grid.addEventListener(type, (e) =>
      events.push({ type, detail: (e as CustomEvent).detail as Record<string, unknown> })
    );
  }
  document.body.appendChild(grid);
  await grid.updateComplete;
}

function cell(id: string): HTMLElement {
  return grid.shadowRoot!.querySelector(`.cell[data-button="${id}"]`) as HTMLElement;
}

function pointer(el: Element, type: string, init: Record<string, unknown> = {}): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 10,
      clientY: 10,
      ...init,
    })
  );
}

/** A mouse tap: down + up in place. */
function tap(el: Element): void {
  pointer(el, "pointerdown");
  pointer(el, "pointerup");
}

beforeAll(() => {
  // happy-dom has no pointer capture; the grid calls it on every press
  HTMLElement.prototype.setPointerCapture ??= () => undefined;
  HTMLElement.prototype.releasePointerCapture ??= () => undefined;
});

beforeEach(() => {
  events.length = 0;
  document.body.innerHTML = "";
});

describe("edit mode", () => {
  for (const display of ["assisted", "replica", "all"] as const) {
    it(`${display}: a tap anywhere on a button opens the button sheet`, async () => {
      await mount({ display, editing: true });
      tap(cell("1"));
      expect(events).toEqual([{ type: "open-button", detail: { buttonId: "1" } }]);
    });
  }

  it("all: a tap on an event chip opens the same button sheet", async () => {
    await mount({ display: "all", editing: true });
    const chip = cell("2").querySelector('.chip[data-action="2_double"]')!;
    tap(chip);
    chip.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    expect(events).toEqual([{ type: "open-button", detail: { buttonId: "2" } }]);
  });

  it("dragging one button onto another swaps them", async () => {
    await mount({ display: "assisted", editing: true });
    const from = cell("1");
    const to = cell("2");
    to.getBoundingClientRect = () =>
      ({ left: 100, top: 0, right: 200, bottom: 100, width: 100, height: 100 }) as DOMRect;
    grid.shadowRoot!.elementFromPoint = () => to;
    pointer(from, "pointerdown", { clientX: 10, clientY: 10 });
    pointer(from, "pointermove", { clientX: 150, clientY: 50 });
    pointer(from, "pointerup", { clientX: 150, clientY: 50 });
    expect(events.map((e) => e.type)).toEqual(["layout-changed"]);
    const next = events[0].detail.layout as typeof layout;
    expect(next.buttons["1"]).toEqual(layout.buttons["2"]);
    expect(next.buttons["2"]).toEqual(layout.buttons["1"]);
  });
});

describe("dashboard", () => {
  it("all: clicking a chip runs that event; unassigned chips do nothing", async () => {
    await mount({ display: "all", editing: false });
    const click = (action: string) =>
      cell(action[0])
        .querySelector(`.chip[data-action="${action}"]`)!
        .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    click("1_single");
    click("1_double");
    expect(events).toEqual([{ type: "run-action", detail: { actionId: "1_single" } }]);
  });

  it("all with hideUnset: unset chips are left out, edit mode shows them", async () => {
    const chips = (id: string) =>
      [...cell(id).querySelectorAll(".chip")].map((c) => c.getAttribute("data-action"));
    await mount({ display: "all", editing: false, hideUnset: true });
    expect(chips("1")).toEqual(["1_single"]);
    expect(chips("2")).toEqual(["2_single", "2_double"]);
    grid.editing = true;
    await grid.updateComplete;
    expect(chips("1")).toEqual(["1_single", "1_double"]);
  });

  it("assisted with a mouse: a tap opens the fan instead of running anything", async () => {
    await mount({ display: "assisted", editing: false, assistedTrigger: "tap" });
    tap(cell("2"));
    await grid.updateComplete;
    expect(events).toEqual([]);
    expect(cell("2").classList.contains("active")).toBe(true);
    expect(cell("2").querySelectorAll(".opt").length).toBe(2);
  });
});

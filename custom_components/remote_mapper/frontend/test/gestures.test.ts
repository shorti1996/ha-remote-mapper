import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TapRecognizer, type Gesture, type GestureCaps } from "../src/gestures";

const down = (x = 0, y = 0) => ({ clientX: x, clientY: y }) as PointerEvent;
const none: GestureCaps = { double: false, triple: false, hold: false };
const all: GestureCaps = { double: true, triple: true, hold: true };

describe("TapRecognizer", () => {
  let out: Gesture[];
  let rec: TapRecognizer;
  beforeEach(() => {
    vi.useFakeTimers();
    out = [];
    rec = new TapRecognizer((g) => out.push(g), { holdMs: 500, multiMs: 280, moveTolerance: 10 });
  });
  afterEach(() => vi.useRealTimers());

  it("single fires on lift when the button has no double/triple", () => {
    rec.down(down(), none);
    rec.up();
    expect(out).toEqual(["single"]);
  });

  it("waits for a second tap only when a double exists", () => {
    rec.down(down(), { ...none, double: true });
    rec.up();
    expect(out).toEqual([]);
    vi.advanceTimersByTime(279);
    expect(out).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(out).toEqual(["single"]);
  });

  it("double and triple", () => {
    rec.down(down(), { ...none, double: true });
    rec.up();
    rec.down(down(), { ...none, double: true });
    rec.up();
    expect(out).toEqual(["double"]); // no triple → fires immediately
    out.length = 0;
    for (let i = 0; i < 3; i++) {
      rec.down(down(), all);
      rec.up();
    }
    expect(out).toEqual(["triple"]);
  });

  it("hold then release", () => {
    rec.down(down(), all);
    vi.advanceTimersByTime(500);
    expect(out).toEqual(["hold"]);
    rec.up();
    expect(out).toEqual(["hold", "release"]);
  });

  it("movement past the tolerance cancels (scroll), pointercancel too", () => {
    rec.down(down(0, 0), all);
    rec.move({ clientX: 0, clientY: 20 } as PointerEvent);
    vi.advanceTimersByTime(600);
    rec.up();
    expect(out).toEqual([]);
    rec.down(down(), none);
    rec.cancel();
    rec.up();
    expect(out).toEqual([]);
  });

  it("ignores a second down while already down", () => {
    rec.down(down(), none);
    rec.down(down(), none);
    rec.up();
    expect(out).toEqual(["single"]);
  });
});

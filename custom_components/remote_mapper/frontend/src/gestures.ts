/**
 * Tap recognizer for the "normal" display mode: dashboard gestures on a
 * button cell map 1:1 to the physical remote's events (tap → single,
 * double-tap → double, triple → triple, hold → hold, lift after hold →
 * release).
 *
 * Capability-aware: the multi-tap wait only applies when the button has a
 * double/triple action, so single-only buttons fire on lift. Movement past
 * a small tolerance (or a pointercancel from the browser taking over for a
 * scroll) aborts the gesture.
 */

export type Gesture = "single" | "double" | "triple" | "hold" | "release";

export interface GestureCaps {
  double: boolean;
  triple: boolean;
  hold: boolean;
}

export interface RecognizerOptions {
  holdMs: number;
  multiMs: number;
  moveTolerance: number;
}

const DEFAULTS: RecognizerOptions = { holdMs: 500, multiMs: 280, moveTolerance: 10 };

export class TapRecognizer {
  private _taps = 0;
  private _caps: GestureCaps = { double: false, triple: false, hold: false };
  private _held = false;
  private _down = false;
  private _startX = 0;
  private _startY = 0;
  private _holdTimer?: ReturnType<typeof setTimeout>;
  private _multiTimer?: ReturnType<typeof setTimeout>;
  private readonly _opts: RecognizerOptions;

  constructor(
    private readonly _emit: (gesture: Gesture) => void,
    opts: Partial<RecognizerOptions> = {}
  ) {
    this._opts = { ...DEFAULTS, ...opts };
  }

  /** True while a multi-tap window is open (cell can show "…"). */
  get pending(): boolean {
    return this._multiTimer !== undefined;
  }

  down(e: PointerEvent, caps: GestureCaps): void {
    if (this._down) return;
    this._down = true;
    this._held = false;
    this._caps = caps;
    this._startX = e.clientX;
    this._startY = e.clientY;
    // a new press inside the window continues the tap sequence
    if (this._multiTimer !== undefined) {
      clearTimeout(this._multiTimer);
      this._multiTimer = undefined;
    }
    if (caps.hold) {
      this._holdTimer = setTimeout(() => {
        this._holdTimer = undefined;
        this._held = true;
        this._taps = 0;
        this._emit("hold");
      }, this._opts.holdMs);
    }
  }

  move(e: PointerEvent): void {
    if (!this._down) return;
    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;
    if (dx * dx + dy * dy > this._opts.moveTolerance ** 2) this.cancel();
  }

  up(): void {
    if (!this._down) return;
    this._down = false;
    this._clearHold();
    if (this._held) {
      this._held = false;
      this._emit("release");
      return;
    }
    this._taps++;
    const { double, triple } = this._caps;
    if (this._taps >= 3 || (this._taps === 2 && !triple) || (this._taps === 1 && !double && !triple)) {
      this._flush();
      return;
    }
    this._multiTimer = setTimeout(() => {
      this._multiTimer = undefined;
      this._flush();
    }, this._opts.multiMs);
  }

  /** Abort without emitting (scroll, pointercancel, element teardown). */
  cancel(): void {
    this._down = false;
    this._held = false;
    this._taps = 0;
    this._clearHold();
    if (this._multiTimer !== undefined) {
      clearTimeout(this._multiTimer);
      this._multiTimer = undefined;
    }
  }

  private _flush(): void {
    const taps = this._taps;
    this._taps = 0;
    if (taps >= 3) this._emit("triple");
    else if (taps === 2) this._emit("double");
    else if (taps === 1) this._emit("single");
  }

  private _clearHold(): void {
    if (this._holdTimer !== undefined) {
      clearTimeout(this._holdTimer);
      this._holdTimer = undefined;
    }
  }
}

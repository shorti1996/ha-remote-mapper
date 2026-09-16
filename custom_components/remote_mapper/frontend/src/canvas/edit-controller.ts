// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Vendored from widget-canvas-ha src/editor/edit-controller.ts.
 * Adapted for Remote Mapper: slot tiles are fixed by hardware, so the
 * add / duplicate / delete mutations are removed; everything else
 * (drag/resize with direct-DOM writes, snap, undo, D-pad, keyboard,
 * session resume) is upstream behavior.
 */

import { cellsOf, snapPos, snapSize } from "./grid";
import { applyZOp, maxZ, normalizeZ, type ZOp } from "./zorder";
import {
  createSession,
  endSession,
  getSession,
  type EditSession,
} from "./session";
import type { NormalizedConfig, WidgetConfig } from "./types";
import { deepClone, deepEqual } from "./util";

export interface EditHost {
  config(): NormalizedConfig | undefined;
  /** current canvas-units → CSS px scale */
  scale(): number;
  slotEl(id: string): HTMLElement | null;
  badgeEl(): HTMLElement | null;
  requestUpdate(): void;
  /** persist the working widget list; resolve true when saved */
  saveWorking(widgets: WidgetConfig[]): Promise<boolean>;
  /** open the settings dialog for a widget */
  openSettings(id: string): void;
  /** surface a short user-facing message (toast) */
  notify(message: string): void;
}

type Corner = "nw" | "ne" | "sw" | "se";

interface DragState {
  kind: "move" | "resize";
  pointerId: number;
  widgetId: string;
  startClientX: number;
  startClientY: number;
  orig: WidgetConfig;
  corner?: Corner;
  moved: boolean;
  next: { x: number; y: number; w: number; h: number };
}

const LONG_PRESS_MS = 800;
const LONG_PRESS_DRIFT_PX = 18;
const DPAD_REPEAT_DELAY_MS = 350;
const DPAD_REPEAT_MS = 70;
const UNDO_CAP = 25;

export class EditController {
  private host: EditHost;
  private session: EditSession | null = null;
  private drag: DragState | null = null;
  private lpTimer: number | undefined;
  private lpStart: { x: number; y: number } | null = null;
  private dpadTimer: number | undefined;
  private dpadInterval: number | undefined;
  private keydownBound = (ev: KeyboardEvent) => this.onKeyDown(ev);

  constructor(host: EditHost) {
    this.host = host;
  }

  // ── state accessors ────────────────────────────────────────────────

  get active(): boolean {
    return this.session?.active ?? false;
  }

  get working(): WidgetConfig[] {
    return this.session?.working ?? [];
  }

  get selectedId(): string | null {
    return this.session?.selectedId ?? null;
  }

  get selected(): WidgetConfig | undefined {
    const id = this.selectedId;
    return id ? this.working.find((w) => w.id === id) : undefined;
  }

  get dpadMode(): "fine" | "cell" {
    return this.session?.dpadMode ?? "fine";
  }

  get dpadSteps(): { x: number; y: number } {
    if (this.dpadMode === "fine") return { x: 1, y: 1 };
    const cfg = this.host.config();
    return cfg ? cellsOf(cfg.grid) : { x: 1, y: 1 };
  }

  get dirty(): boolean {
    return !!this.session && !deepEqual(this.session.working, this.session.original);
  }

  get canUndo(): boolean {
    return (this.session?.undoStack.length ?? 0) > 0;
  }

  get dragging(): boolean {
    return this.drag !== null;
  }

  // ── lifecycle ──────────────────────────────────────────────────────

  /** Re-attach to a session that survived a view rebuild. */
  tryResume(): boolean {
    const cfg = this.host.config();
    const session = getSession(cfg?.canvas_id);
    if (session?.active) {
      this.session = session;
      window.addEventListener("keydown", this.keydownBound);
      return true;
    }
    return false;
  }

  enter(): void {
    if (this.session?.active) return;
    const cfg = this.host.config();
    if (!cfg?.canvas_id) return;
    this.session = createSession(cfg.canvas_id, deepClone(cfg.widgets));
    window.addEventListener("keydown", this.keydownBound);
    this.host.requestUpdate();
  }

  /** Done: persist working state. */
  async done(): Promise<void> {
    const session = this.session;
    if (!session) return;
    const widgets = normalizeZ(session.working);
    this.teardown();
    const ok = await this.host.saveWorking(widgets);
    if (!ok) {
      const cfg = this.host.config();
      this.session = createSession(session.canvasId, widgets);
      this.session.original = deepClone(cfg?.widgets ?? []);
      window.addEventListener("keydown", this.keydownBound);
    }
    this.host.requestUpdate();
  }

  /** Cancel: discard working state, revert to last saved layout. */
  cancel(): void {
    if (!this.session) return;
    if (this.dirty && !window.confirm("Discard layout changes?")) return;
    this.teardown();
    this.host.requestUpdate();
  }

  detach(): void {
    // element is going away; keep the session in the registry for resume
    window.removeEventListener("keydown", this.keydownBound);
    this.clearDpadRepeat();
    this.cancelLongPress();
    this.session = null;
  }

  private teardown(): void {
    window.removeEventListener("keydown", this.keydownBound);
    this.clearDpadRepeat();
    this.cancelLongPress();
    endSession(this.session?.canvasId);
    this.session = null;
    this.drag = null;
  }

  // ── mutations ──────────────────────────────────────────────────────

  private pushUndo(): void {
    const s = this.session;
    if (!s) return;
    s.undoStack.push(deepClone(s.working));
    if (s.undoStack.length > UNDO_CAP) s.undoStack.shift();
  }

  undo(): void {
    const s = this.session;
    if (!s) return;
    const prev = s.undoStack.pop();
    if (!prev) return;
    s.working = prev;
    if (s.selectedId && !prev.some((w) => w.id === s.selectedId)) s.selectedId = null;
    this.host.requestUpdate();
  }

  select(id: string | null): void {
    const s = this.session;
    if (!s) return;
    s.selectedId = id;
    this.host.requestUpdate();
  }

  updateWidget(
    id: string,
    patch: Partial<WidgetConfig>,
    opts?: { undo?: boolean }
  ): void {
    const s = this.session;
    if (!s) return;
    if (opts?.undo !== false) this.pushUndo();
    s.working = s.working.map((w) =>
      w.id === id ? ({ ...w, ...patch } as WidgetConfig) : w
    );
    this.host.requestUpdate();
  }

  zOp(op: ZOp): void {
    const s = this.session;
    if (!s?.selectedId) return;
    this.pushUndo();
    s.working = applyZOp(s.working, s.selectedId, op);
    this.host.requestUpdate();
  }

  /** Ensure tiles exist for every action id (probe may grow the set). */
  ensureTiles(make: (id: string, index: number) => WidgetConfig, ids: string[]): void {
    const s = this.session;
    if (!s) return;
    const have = new Set(s.working.map((w) => w.id));
    const missing = ids.filter((id) => !have.has(id));
    if (!missing.length) return;
    this.pushUndo();
    const added = missing.map((id, i) => ({
      ...make(id, i),
      z: maxZ(s.working) + 1 + i,
    }));
    s.working = [...s.working, ...added];
    this.host.requestUpdate();
  }

  toggleDpadStep(): void {
    const s = this.session;
    if (!s) return;
    s.dpadMode = s.dpadMode === "fine" ? "cell" : "fine";
    this.host.requestUpdate();
  }

  /** Raw position + clamp; NO grid snapping — the D-pad exists for precision. */
  nudge(dx: number, dy: number): void {
    const s = this.session;
    const cfg = this.host.config();
    const sel = this.selected;
    if (!s || !cfg || !sel) return;
    const nx = clamp(sel.x + dx, 0, Math.max(0, cfg.design_size.width - sel.w));
    const ny = clamp(sel.y + dy, 0, Math.max(0, cfg.design_size.height - sel.h));
    if (nx === sel.x && ny === sel.y) return;
    this.updateWidget(sel.id, { x: round2(nx), y: round2(ny) }, { undo: false });
  }

  /** One undo entry per D-pad press-burst, not per repeat tick. */
  dpadPress(dx: number, dy: number): void {
    if (!this.session) return;
    this.pushUndo();
    const tick = () => {
      const steps = this.dpadSteps;
      this.nudge(dx * steps.x, dy * steps.y);
    };
    tick();
    this.clearDpadRepeat();
    this.dpadTimer = window.setTimeout(() => {
      this.dpadInterval = window.setInterval(tick, DPAD_REPEAT_MS);
    }, DPAD_REPEAT_DELAY_MS);
  }

  dpadRelease(): void {
    this.clearDpadRepeat();
  }

  private clearDpadRepeat(): void {
    if (this.dpadTimer !== undefined) clearTimeout(this.dpadTimer);
    if (this.dpadInterval !== undefined) clearInterval(this.dpadInterval);
    this.dpadTimer = this.dpadInterval = undefined;
  }

  // ── keyboard ───────────────────────────────────────────────────────

  private onKeyDown(ev: KeyboardEvent): void {
    if (!this.session?.active) return;
    if (isTypingTarget(ev)) return;
    switch (ev.key) {
      case "Escape":
        ev.preventDefault();
        this.cancel();
        return;
      case "z":
        if (ev.ctrlKey || ev.metaKey) {
          ev.preventDefault();
          this.undo();
        }
        return;
      default:
        break;
    }
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const dir = arrows[ev.key];
    if (dir && this.selectedId) {
      ev.preventDefault();
      const steps = this.dpadSteps;
      const mult = ev.shiftKey ? 5 : 1;
      if (!ev.repeat) this.pushUndo();
      this.nudge(dir[0] * steps.x * mult, dir[1] * steps.y * mult);
    }
  }

  // ── pointer: move / resize ─────────────────────────────────────────

  onSlotPointerDown(ev: PointerEvent, widgetId: string): void {
    const s = this.session;
    if (!s || this.drag || ev.button > 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (s.selectedId !== widgetId) this.select(widgetId);
    const orig = this.working.find((w) => w.id === widgetId);
    if (!orig) return;
    this.startDrag(ev, {
      kind: "move",
      pointerId: ev.pointerId,
      widgetId,
      startClientX: ev.clientX,
      startClientY: ev.clientY,
      orig: { ...orig },
      moved: false,
      next: { x: orig.x, y: orig.y, w: orig.w, h: orig.h },
    });
  }

  onHandlePointerDown(ev: PointerEvent, widgetId: string, corner: Corner): void {
    if (!this.session || this.drag || ev.button > 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    const orig = this.working.find((w) => w.id === widgetId);
    if (!orig) return;
    this.startDrag(ev, {
      kind: "resize",
      pointerId: ev.pointerId,
      widgetId,
      startClientX: ev.clientX,
      startClientY: ev.clientY,
      orig: { ...orig },
      corner,
      moved: false,
      next: { x: orig.x, y: orig.y, w: orig.w, h: orig.h },
    });
  }

  private startDrag(ev: PointerEvent, drag: DragState): void {
    this.drag = drag;
    const target = ev.currentTarget as Element;
    try {
      target.setPointerCapture(ev.pointerId);
    } catch {
      /* detached */
    }
    const onMove = (e: PointerEvent) => this.onDragMove(e);
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerup", onEnd as EventListener);
      target.removeEventListener("pointercancel", onCancel as EventListener);
      this.finishDrag(false);
    };
    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerup", onEnd as EventListener);
      target.removeEventListener("pointercancel", onCancel as EventListener);
      this.finishDrag(true);
    };
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerup", onEnd as EventListener);
    target.addEventListener("pointercancel", onCancel as EventListener);
  }

  private onDragMove(ev: PointerEvent): void {
    const d = this.drag;
    const cfg = this.host.config();
    if (!d || !cfg || ev.pointerId !== d.pointerId) return;
    const scale = this.host.scale() || 1;
    // clientX/Y are visual-space px — divide by scale for canvas units
    const dx = (ev.clientX - d.startClientX) / scale;
    const dy = (ev.clientY - d.startClientY) / scale;
    if (!d.moved && Math.hypot(dx * scale, dy * scale) < 3) return;
    d.moved = true;

    const design = cfg.design_size;
    const cells = cellsOf(cfg.grid);

    if (d.kind === "move") {
      d.next.x = clamp(d.orig.x + dx, 0, Math.max(0, design.width - d.orig.w));
      d.next.y = clamp(d.orig.y + dy, 0, Math.max(0, design.height - d.orig.h));
    } else {
      const c = d.corner!;
      const wholeCellsX = (v: number) =>
        Math.max(cells.x, Math.floor(v / cells.x) * cells.x);
      const wholeCellsY = (v: number) =>
        Math.max(cells.y, Math.floor(v / cells.y) * cells.y);
      let { x, y, w, h } = d.orig;
      if (c === "se" || c === "ne") w = d.orig.w + dx;
      if (c === "sw" || c === "nw") w = d.orig.w - dx;
      if (c === "se" || c === "sw") h = d.orig.h + dy;
      if (c === "ne" || c === "nw") h = d.orig.h - dy;
      // sizes snap live to the internal grid (phone-widget model)
      w = clamp(snapSize(w, cells.x), cells.x, design.width);
      h = clamp(snapSize(h, cells.y), cells.y, design.height);
      if (c === "sw" || c === "nw") {
        const right = d.orig.x + d.orig.w;
        if (w > right) w = wholeCellsX(right);
        x = round2(right - w);
      } else if (x + w > design.width) {
        w = wholeCellsX(design.width - x);
      }
      if (c === "ne" || c === "nw") {
        const bottom = d.orig.y + d.orig.h;
        if (h > bottom) h = wholeCellsY(bottom);
        y = round2(bottom - h);
      } else if (y + h > design.height) {
        h = wholeCellsY(design.height - y);
      }
      d.next = { x, y, w, h };
    }

    // direct-DOM application during drag — no Lit re-render churn (DDC-proven)
    const slot = this.host.slotEl(d.widgetId);
    if (slot) {
      slot.style.transform = `translate3d(${d.next.x}px, ${d.next.y}px, 0)`;
      if (d.kind === "resize") {
        slot.style.width = `${d.next.w}px`;
        slot.style.height = `${d.next.h}px`;
      }
    }
    this.updateBadgeText(d.next);
  }

  private finishDrag(canceled: boolean): void {
    const d = this.drag;
    const cfg = this.host.config();
    this.drag = null;
    if (!d || !cfg) return;
    if (canceled || !d.moved) {
      // Lit memoizes unchanged style expressions and won't undo our direct
      // DOM writes — restore the slot explicitly.
      this.syncSlotStyle(d.widgetId, d.orig);
      this.host.requestUpdate();
      return;
    }
    let { x, y } = d.next;
    if (d.kind === "move" && cfg.grid.snap_position) {
      const cells = cellsOf(cfg.grid);
      x = clamp(snapPos(x, cells.x), 0, Math.max(0, cfg.design_size.width - d.next.w));
      y = clamp(snapPos(y, cells.y), 0, Math.max(0, cfg.design_size.height - d.next.h));
    }
    const final = { x: round2(x), y: round2(y), w: d.next.w, h: d.next.h };
    // if committed values equal the pre-drag state (snap-back), Lit skips
    // the attribute write and the raw drag offset would stick
    this.syncSlotStyle(d.widgetId, final);
    this.updateBadgeText(final);
    this.pushUndo();
    this.updateWidget(d.widgetId, final, { undo: false });
  }

  private syncSlotStyle(
    id: string,
    r: { x: number; y: number; w: number; h: number }
  ): void {
    const slot = this.host.slotEl(id);
    if (!slot) return;
    slot.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
    slot.style.width = `${r.w}px`;
    slot.style.height = `${r.h}px`;
  }

  private updateBadgeText(r: { x: number; y: number; w: number; h: number }): void {
    const badge = this.host.badgeEl();
    if (badge) {
      badge.textContent = `x ${Math.round(r.x)}  y ${Math.round(r.y)}  ·  ${r.w}×${r.h}`;
    }
  }

  // ── long-press to enter edit (view mode) ───────────────────────────

  onViewPointerDown(ev: PointerEvent): void {
    if (this.session?.active || ev.button > 0) return;
    // only from empty canvas area — not over a tile or the pencil
    const path = ev.composedPath();
    for (const t of path) {
      if (t instanceof HTMLElement) {
        if (t.classList?.contains("widget-slot")) return;
        if (t.classList?.contains("pencil")) return;
      }
    }
    this.lpStart = { x: ev.clientX, y: ev.clientY };
    this.lpTimer = window.setTimeout(() => {
      this.lpTimer = undefined;
      this.enter();
    }, LONG_PRESS_MS);
  }

  onViewPointerMove(ev: PointerEvent): void {
    if (this.lpTimer === undefined || !this.lpStart) return;
    if (
      Math.hypot(ev.clientX - this.lpStart.x, ev.clientY - this.lpStart.y) >
      LONG_PRESS_DRIFT_PX
    ) {
      this.cancelLongPress();
    }
  }

  cancelLongPress(): void {
    if (this.lpTimer !== undefined) clearTimeout(this.lpTimer);
    this.lpTimer = undefined;
    this.lpStart = null;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function isTypingTarget(ev: KeyboardEvent): boolean {
  const path = ev.composedPath();
  for (const t of path) {
    if (!(t instanceof HTMLElement)) continue;
    const tag = t.localName;
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (t.isContentEditable) return true;
    const role = t.getAttribute?.("role");
    if (role === "textbox" || role === "combobox" || role === "searchbox") return true;
  }
  return false;
}

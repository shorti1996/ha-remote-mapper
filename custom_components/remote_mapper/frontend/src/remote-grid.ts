/**
 * <remote-mapper-grid> — the button grid in all three display modes,
 * plus edit-mode drag-to-swap. Pure presentation: takes buttons, layout
 * and slot summaries; emits events; never talks to HA.
 *
 * Events (all bubble + composed):
 *   run-action     {actionId}   dashboard gesture resolved to a slot
 *   edit-action    {actionId}   edit mode: open the slot editor
 *   open-button    {buttonId}   edit mode: open the button sheet
 *   layout-changed {layout}     edit mode: cells swapped
 */
import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { AssistedTrigger, ChipsLayout } from "./config";
import { type Gesture, type GestureCaps, TapRecognizer } from "./gestures";
import {
  actionOfKind,
  buttonLabel,
  cellMap,
  KIND_ICON,
  KIND_TITLE,
  swapCells,
  type ButtonModel,
  type DisplayMode,
  type GridLayout,
  type Kind,
} from "./model";

export interface SlotView {
  assigned: boolean;
  archived: boolean;
  summary: string;
  error: string | null;
  stale: boolean;
}

interface DragState {
  id: string;
  row: number;
  col: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
  /** Pointer went down on an event chip (all mode) — tap = edit it. */
  fromChip?: string;
}

const DRAG_THRESHOLD = 8;
/** Arc radius for assisted options, in % of the cell's width/height. */
const ARC_RADIUS = 34;

/**
 * Pinterest-style fan: angles (degrees clockwise from "up") for n options.
 * Up to four fan across the top half; more go all the way around.
 */
function arcAngles(n: number): number[] {
  if (n <= 1) return [0];
  if (n <= 4) {
    const span = n === 2 ? 70 : n === 3 ? 120 : 165;
    return Array.from({ length: n }, (_, i) => -span / 2 + (i * span) / (n - 1));
  }
  return Array.from({ length: n }, (_, i) => (i * 360) / n);
}

@customElement("remote-mapper-grid")
export class RemoteMapperGrid extends LitElement {
  @property({ attribute: false }) public buttons: ButtonModel[] = [];
  @property({ attribute: false }) public layout?: GridLayout;
  @property({ attribute: false }) public slots: Record<string, SlotView> = {};
  @property() public display: DisplayMode = "normal";
  @property({ type: Boolean }) public editing = false;
  /** Action id currently flashing (after a run). */
  @property() public flash?: string;
  /** assisted: auto (per pointer type), tap (toggle) or press (hold, slide, lift). */
  @property() public assistedTrigger: AssistedTrigger = "auto";
  /** all: arrangement of a button's event chips. */
  @property() public chipsLayout: ChipsLayout = "vertical";

  @state() private _popover?: string;
  @state() private _hoverOpt?: string;
  /** Trigger resolved at pointerdown (auto → by pointerType), used at pointerup. */
  private _pressMode: "tap" | "press" = "tap";
  @state() private _drag?: DragState;
  @state() private _dropTarget?: string;

  private _recognizers = new Map<string, TapRecognizer>();

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const rec of this._recognizers.values()) rec.cancel();
  }

  protected override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("editing") || changed.has("display")) {
      this._popover = undefined;
      this._drag = undefined;
      this._dropTarget = undefined;
      for (const rec of this._recognizers.values()) rec.cancel();
    }
  }

  // ── events out ────────────────────────────────────────────────────

  private _emit(type: string, detail: Record<string, unknown>): void {
    this.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true })
    );
  }

  private _run(actionId: string): void {
    const slot = this.slots[actionId];
    if (slot?.assigned && !slot.archived) this._emit("run-action", { actionId });
  }

  // ── normal mode gestures ──────────────────────────────────────────

  private _recognizer(button: ButtonModel): TapRecognizer {
    let rec = this._recognizers.get(button.id);
    if (!rec) {
      rec = new TapRecognizer((g) => this._onGesture(button.id, g));
      this._recognizers.set(button.id, rec);
    }
    return rec;
  }

  private _live(button: ButtonModel, kind: Kind): string | undefined {
    const action = actionOfKind(button, kind);
    const slot = action ? this.slots[action.action_id] : undefined;
    return slot?.assigned && !slot.archived ? action!.action_id : undefined;
  }

  private _caps(button: ButtonModel): GestureCaps {
    return {
      double: !!this._live(button, "double"),
      triple: !!this._live(button, "triple"),
      hold: !!this._live(button, "hold"),
    };
  }

  private _onGesture(buttonId: string, gesture: Gesture): void {
    const button = this.buttons.find((b) => b.id === buttonId);
    if (!button) return;
    const actionId = this._live(button, gesture);
    if (actionId) this._emit("run-action", { actionId });
  }

  // ── pointer plumbing ──────────────────────────────────────────────

  private _elementAt(x: number, y: number): Element | null {
    return this.shadowRoot?.elementFromPoint(x, y) ?? null;
  }

  private _cellKeyAt(x: number, y: number): string | undefined {
    const cell = this._elementAt(x, y)?.closest(".cell") as HTMLElement | null;
    return cell?.dataset.row !== undefined
      ? `${cell.dataset.row},${cell.dataset.col}`
      : undefined;
  }

  private _onCellDown(
    e: PointerEvent,
    button: ButtonModel,
    row: number,
    col: number
  ): void {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    if (this.editing) {
      el.setPointerCapture(e.pointerId);
      const chip = (e.target as HTMLElement).closest?.(".chip") as HTMLElement | null;
      this._drag = {
        id: button.id,
        row,
        col,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        fromChip: chip?.dataset.action,
      };
      return;
    }
    if (this.display === "normal") {
      el.setPointerCapture(e.pointerId);
      this._recognizer(button).down(e, this._caps(button));
    } else if (this.display === "assisted") {
      el.setPointerCapture(e.pointerId);
      // auto: a finger gets Pinterest press-slide-lift, a mouse/pen gets tap
      this._pressMode =
        this.assistedTrigger === "auto"
          ? e.pointerType === "touch"
            ? "press"
            : "tap"
          : this.assistedTrigger;
      // press mode opens right away; tap mode toggles on lift
      if (this._pressMode === "press") this._popover = button.id;
    }
    // "all": chips handle their own clicks
  }

  private _optAt(x: number, y: number): string | undefined {
    const opt = this._elementAt(x, y)?.closest(".opt") as HTMLElement | null;
    return opt?.dataset.action;
  }

  private _onCellMove(e: PointerEvent, button: ButtonModel): void {
    const drag = this._drag;
    if (drag) {
      if (!drag.moved) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      }
      this._drag = { ...drag, moved: true, x: e.clientX, y: e.clientY };
      this._dropTarget = this._cellKeyAt(e.clientX, e.clientY);
      return;
    }
    if (this.editing) return;
    if (this.display === "normal") {
      this._recognizers.get(button.id)?.move(e);
    } else if (this.display === "assisted" && this._popover === button.id) {
      const over = this._optAt(e.clientX, e.clientY);
      if (over !== this._hoverOpt) this._hoverOpt = over;
    }
  }

  private _onCellUp(e: PointerEvent, button: ButtonModel): void {
    const drag = this._drag;
    if (drag) {
      const target = this._dropTarget;
      this._drag = undefined;
      this._dropTarget = undefined;
      if (drag.moved) {
        if (target && this.layout) {
          const [row, col] = target.split(",").map(Number);
          const next = swapCells(this.layout, drag, { row, col });
          if (next !== this.layout) this._emit("layout-changed", { layout: next });
        }
      } else if (drag.fromChip) {
        this._emit("edit-action", { actionId: drag.fromChip });
      } else {
        this._emit("open-button", { buttonId: drag.id });
      }
      return;
    }
    if (this.display === "normal") {
      this._recognizers.get(button.id)?.up();
      return;
    }
    if (this.display === "assisted") {
      const picked = this._popover === button.id
        ? this._optAt(e.clientX, e.clientY)
        : undefined;
      this._hoverOpt = undefined;
      if (picked) {
        // lifted (or tapped) on an option
        this._popover = undefined;
        this._run(picked);
      } else if (this._pressMode === "press") {
        // Pinterest: lifting anywhere else dismisses
        this._popover = undefined;
      } else {
        // tap mode: a tap toggles this button's popover
        this._popover = this._popover === button.id ? undefined : button.id;
      }
    }
  }

  private _onCellCancel(button: ButtonModel): void {
    this._drag = undefined;
    this._dropTarget = undefined;
    this._hoverOpt = undefined;
    this._recognizers.get(button.id)?.cancel();
  }

  // ── render ────────────────────────────────────────────────────────

  protected override render() {
    const layout = this.layout;
    if (!layout) return nothing;
    const map = cellMap(layout);
    const byId = new Map(this.buttons.map((b) => [b.id, b]));
    const cells: TemplateResult[] = [];
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        const id = map.get(`${r},${c}`);
        const button = id ? byId.get(id) : undefined;
        cells.push(
          button ? this._renderButton(button, layout, r, c) : this._renderEmpty(r, c)
        );
      }
    }
    const drag = this._drag;
    const dragButton = drag?.moved ? byId.get(drag.id) : undefined;
    return html`
      ${this._popover
        ? html`<div
            class="backdrop"
            @pointerdown=${() => {
              this._popover = undefined;
            }}
          ></div>`
        : nothing}
      <div
        class="grid ${this.display} ${this.editing ? "editing" : ""}"
        style="grid-template-columns: repeat(${layout.cols}, minmax(0, 1fr))"
      >
        ${cells}
      </div>
      ${dragButton && drag
        ? html`<div class="ghost" style="left:${drag.x}px;top:${drag.y}px">
            ${buttonLabel(dragButton, layout)}
          </div>`
        : nothing}
    `;
  }

  private _renderEmpty(row: number, col: number): TemplateResult {
    const key = `${row},${col}`;
    return html`<div
      class="cell empty ${this._dropTarget === key ? "drop" : ""}"
      data-row=${row}
      data-col=${col}
    ></div>`;
  }

  private _renderButton(
    button: ButtonModel,
    layout: GridLayout,
    row: number,
    col: number
  ): TemplateResult {
    const key = `${row},${col}`;
    const flashing = this.flash && button.actions.some((a) => a.action_id === this.flash);
    const error = button.actions
      .map((a) => this.slots[a.action_id]?.error)
      .find((e) => !!e);
    const classes = [
      "cell",
      "btn",
      this._drag?.id === button.id && this._drag.moved ? "dragging" : "",
      this._dropTarget === key ? "drop" : "",
      this._popover === button.id ? "active" : "",
      flashing && this.display !== "all" ? "flash" : "",
    ].join(" ");
    return html`
      <div
        class=${classes}
        data-row=${row}
        data-col=${col}
        data-button=${button.id}
        @pointerdown=${(e: PointerEvent) => this._onCellDown(e, button, row, col)}
        @pointermove=${(e: PointerEvent) => this._onCellMove(e, button)}
        @pointerup=${(e: PointerEvent) => this._onCellUp(e, button)}
        @pointercancel=${() => this._onCellCancel(button)}
      >
        <span class="label">${buttonLabel(button, layout)}</span>
        ${this.display === "all"
          ? this._renderChips(button)
          : this._renderCompact(button)}
        ${error
          ? html`<span class="badge err" title=${error}>!</span>`
          : nothing}
        ${this._popover === button.id ? this._renderPopover(button) : nothing}
      </div>
    `;
  }

  private _renderCompact(button: ButtonModel): TemplateResult {
    const live = button.actions.filter((a) => this.slots[a.action_id]?.assigned);
    const primary = live[0];
    return html`
      <span class="summary"
        >${primary ? this.slots[primary.action_id].summary : "unassigned"}</span
      >
      <span class="kinds">
        ${button.actions.map((a) => {
          const slot = this.slots[a.action_id];
          const on = slot?.assigned && !slot.archived;
          return html`<span
            class="kind ${on ? "on" : ""} ${this.flash === a.action_id ? "flash" : ""}"
            title="${a.event} (${KIND_TITLE[a.kind]}): ${slot?.summary ?? "unassigned"}"
            >${KIND_ICON[a.kind]}</span
          >`;
        })}
      </span>
    `;
  }

  private _renderChips(button: ButtonModel): TemplateResult {
    return html`
      <div class="chips ${this.chipsLayout}">
        ${button.actions.map((a) => {
          const slot = this.slots[a.action_id];
          const classes = [
            "chip",
            slot?.assigned ? "on" : "",
            slot?.archived ? "archived" : "",
            this.flash === a.action_id ? "flash" : "",
          ].join(" ");
          return html`
            <button
              class=${classes}
              data-action=${a.action_id}
              title="${a.event} (${KIND_TITLE[a.kind]})"
              @click=${(e: Event) => {
                if (this.editing) return;
                e.stopPropagation();
                this._run(a.action_id);
              }}
            >
              <span class="icon">${KIND_ICON[a.kind]}</span>
              <span class="text">${slot?.summary ?? "unassigned"}</span>
              ${slot?.error ? html`<span class="err" title=${slot.error}>!</span>` : nothing}
              ${slot?.stale ? html`<span class="stale" title="Source no longer reports this action">stale</span>` : nothing}
            </button>
          `;
        })}
      </div>
    `;
  }

  private _renderPopover(button: ButtonModel): TemplateResult {
    const angles = arcAngles(button.actions.length);
    return html`
      <div class="popover">
        ${button.actions.map((a, i) => {
          const slot = this.slots[a.action_id];
          const on = slot?.assigned && !slot.archived;
          const hover = this._hoverOpt === a.action_id ? "hover" : "";
          const rad = (angles[i] * Math.PI) / 180;
          const x = 50 + Math.sin(rad) * ARC_RADIUS;
          const y = 50 - Math.cos(rad) * ARC_RADIUS;
          return html`
            <div
              class="opt ${on ? "on" : ""} ${hover}"
              style="--i:${i};left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"
              data-action=${a.action_id}
            >
              <span class="circle" title="${a.event} (${KIND_TITLE[a.kind]})"
                >${KIND_ICON[a.kind]}</span
              >
              <span class="opt-text">${slot?.summary ?? "unassigned"}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      position: relative;
      --rm-bg: var(--rm-button-bg, var(--remote-mapper-button-color, var(--card-background-color, inherit)));
      --rm-fg: var(--rm-text, var(--remote-mapper-text-color, var(--primary-text-color)));
      --rm-ac: var(--rm-accent, var(--remote-mapper-accent-color, var(--primary-color)));
      --rm-line: var(--remote-mapper-border-color, var(--divider-color, #444));
      --rm-on-accent: var(--text-primary-color, #fff);
    }
    .grid {
      display: grid;
      gap: var(--ha-space-2, 8px);
      padding: 0 var(--ha-space-4, 16px) var(--ha-space-4, 16px);
    }
    .cell {
      position: relative;
      box-sizing: border-box;
      min-width: 0;
      border-radius: var(--ha-border-radius-lg, 12px);
    }
    .grid.normal .cell,
    .grid.assisted .cell {
      aspect-ratio: 1.15;
    }
    .cell.btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ha-space-1, 4px);
      padding: var(--ha-space-2, 8px);
      border: 1px solid var(--rm-line);
      background: var(--rm-bg);
      color: var(--rm-fg);
      opacity: var(--rm-opacity, var(--remote-mapper-button-opacity, 1));
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
      transition: background-color 120ms ease, transform 120ms ease;
    }
    .grid.all .cell.btn {
      justify-content: flex-start;
      min-height: var(--ha-space-20, 80px);
    }
    .grid.editing .cell.btn {
      touch-action: none;
      cursor: grab;
    }
    .cell.empty {
      border: 1px dashed transparent;
    }
    .grid.editing .cell.empty {
      border-color: var(--rm-line);
    }
    .cell.dragging {
      opacity: 0.35;
    }
    .cell.drop {
      outline: 2px dashed var(--rm-ac);
      outline-offset: 2px;
    }
    .cell.flash {
      background: var(--rm-ac);
      color: var(--rm-on-accent);
    }
    .cell.active {
      z-index: 9;
      border-color: var(--rm-ac);
    }
    .label {
      font-size: var(--ha-font-size-l, 16px);
      font-weight: var(--ha-font-weight-medium, 500);
      line-height: var(--ha-line-height-condensed, 1.2);
      letter-spacing: 0.1px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .summary {
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-condensed, 1.2);
      color: var(--secondary-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cell.flash .summary {
      color: inherit;
    }
    .kinds {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--ha-space-1, 4px);
      margin-top: var(--ha-space-1, 4px);
    }
    .kind {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ha-space-6, 24px);
      height: var(--ha-space-6, 24px);
      border-radius: var(--ha-border-radius-circle, 50%);
      border: 1px solid var(--rm-line);
      font-size: var(--ha-font-size-s, 12px);
      font-weight: var(--ha-font-weight-medium, 500);
      opacity: 0.35;
    }
    .kind.on {
      opacity: 1;
      border-color: var(--rm-ac);
      color: var(--rm-ac);
    }
    .cell.flash .kind.on {
      color: inherit;
      border-color: currentColor;
    }
    .kind.flash {
      background: var(--rm-ac);
      color: var(--rm-on-accent);
    }
    .badge {
      position: absolute;
      top: var(--ha-space-1, 4px);
      right: var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-s, 12px);
    }
    .err {
      color: var(--error-color, #db4437);
      font-weight: var(--ha-font-weight-bold, 700);
    }
    .stale {
      color: var(--warning-color, #ffa600);
      font-size: var(--ha-font-size-xs, 10px);
    }
    .chips {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-1, 4px);
      width: 100%;
    }
    .chips.horizontal {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .chips.horizontal .chip {
      flex: 1 1 40%;
      width: auto;
    }
    .chips.grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .chips.grid .chip {
      width: auto;
    }
    .chip {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      width: 100%;
      min-height: var(--ha-space-8, 32px);
      box-sizing: border-box;
      padding: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
      border: 1px solid var(--rm-line);
      border-radius: var(--ha-border-radius-md, 8px);
      background: none;
      color: inherit;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-condensed, 1.2);
      text-align: left;
      cursor: pointer;
      opacity: 0.5;
    }
    .chip.on {
      opacity: 1;
      border-color: var(--rm-ac);
    }
    .chip.archived {
      border-style: dashed;
      opacity: 0.35;
    }
    .chip.flash {
      background: var(--rm-ac);
      color: var(--rm-on-accent);
    }
    .chip .icon {
      flex: none;
      width: var(--ha-space-5, 20px);
      text-align: center;
      font-weight: var(--ha-font-weight-medium, 500);
      color: var(--rm-ac);
    }
    .chip.flash .icon {
      color: inherit;
    }
    .chip .text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 8;
    }
    /* Assisted: options fan out INSIDE the pressed cell (Pinterest) */
    .cell.active .label,
    .cell.active .summary,
    .cell.active .kinds {
      opacity: 0.15;
    }
    .popover {
      position: absolute;
      inset: 0;
      z-index: 10;
      border-radius: inherit;
      animation: rm-fade 120ms ease-out;
    }
    .opt {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: min(var(--ha-space-16, 64px), 34%);
      transform: translate(-50%, -50%);
      cursor: pointer;
      opacity: 0.45;
      /* backwards: hidden during the stagger delay, natural opacity after */
      animation: rm-pop 240ms cubic-bezier(0.2, 0.8, 0.2, 1.25) backwards;
      animation-delay: calc(var(--i, 0) * 40ms);
    }
    .opt.on {
      opacity: 1;
    }
    .circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: var(--ha-space-12, 48px);
      aspect-ratio: 1;
      border-radius: var(--ha-border-radius-circle, 50%);
      border: 2px solid var(--rm-ac);
      background: var(--card-background-color, #222);
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.4));
      font-size: var(--ha-font-size-l, 16px);
      font-weight: var(--ha-font-weight-medium, 500);
      pointer-events: none;
      transition: transform 100ms ease, background-color 100ms ease;
    }
    .opt.hover .circle {
      transform: scale(1.2);
      background: var(--rm-ac);
      color: var(--rm-on-accent);
    }
    .opt-text {
      font-size: var(--ha-font-size-xs, 10px);
      line-height: var(--ha-line-height-condensed, 1.2);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
    }
    .ghost {
      position: fixed;
      z-index: 50;
      pointer-events: none;
      transform: translate(-50%, -50%);
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border-radius: var(--ha-border-radius-md, 8px);
      background: var(--rm-ac);
      color: var(--rm-on-accent);
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-medium, 500);
      opacity: 0.9;
    }
    @keyframes rm-pop {
      from {
        transform: translate(-50%, -50%) scale(0.3);
        opacity: 0;
      }
      to {
        transform: translate(-50%, -50%) scale(1);
      }
    }
    @keyframes rm-fade {
      from {
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .popover,
      .opt,
      .circle,
      .cell.btn {
        animation: none;
        transition: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "remote-mapper-grid": RemoteMapperGrid;
  }
}

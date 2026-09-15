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

@customElement("remote-mapper-grid")
export class RemoteMapperGrid extends LitElement {
  @property({ attribute: false }) public buttons: ButtonModel[] = [];
  @property({ attribute: false }) public layout?: GridLayout;
  @property({ attribute: false }) public slots: Record<string, SlotView> = {};
  @property() public display: DisplayMode = "normal";
  @property({ type: Boolean }) public editing = false;
  /** Action id currently flashing (after a run). */
  @property() public flash?: string;

  @state() private _popover?: string;
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
      this._popover = button.id;
    }
    // "all": chips handle their own clicks
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
    if (!this.editing && this.display === "normal") {
      this._recognizers.get(button.id)?.move(e);
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
    if (this.display === "assisted" && this._popover === button.id) {
      // Pinterest-style: release over an option picks it; a plain tap
      // leaves the popover open for a second tap on an option.
      const opt = this._elementAt(e.clientX, e.clientY)?.closest(".opt") as
        | HTMLElement
        | null;
      if (opt?.dataset.action) {
        this._popover = undefined;
        this._run(opt.dataset.action);
      }
    }
  }

  private _onCellCancel(button: ButtonModel): void {
    this._drag = undefined;
    this._dropTarget = undefined;
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
        ${this._popover === button.id
          ? this._renderPopover(button, row === 0, col, layout.cols)
          : nothing}
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
      <div class="chips">
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

  private _renderPopover(
    button: ButtonModel,
    below: boolean,
    col: number,
    cols: number
  ): TemplateResult {
    const edge = cols > 1 && col === 0 ? "edge-left" : cols > 1 && col === cols - 1 ? "edge-right" : "";
    return html`
      <div class="popover ${below ? "below" : "above"} ${edge}">
        ${button.actions.map((a) => {
          const slot = this.slots[a.action_id];
          const on = slot?.assigned && !slot.archived;
          return html`
            <div class="opt ${on ? "on" : ""}" data-action=${a.action_id}>
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
    }
    .grid {
      display: grid;
      gap: 8px;
      padding: 8px 16px 16px;
    }
    .cell {
      position: relative;
      box-sizing: border-box;
      min-width: 0;
      border-radius: 10px;
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
      gap: 3px;
      padding: 6px;
      border: 1px solid var(--divider-color, #444);
      background: var(--card-background-color, inherit);
      color: var(--primary-text-color);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }
    .grid.all .cell.btn {
      justify-content: flex-start;
      min-height: 72px;
    }
    .grid.editing .cell.btn {
      touch-action: none;
      cursor: grab;
    }
    .cell.empty {
      border: 1px dashed transparent;
    }
    .grid.editing .cell.empty {
      border-color: var(--divider-color, #444);
    }
    .cell.dragging {
      opacity: 0.35;
    }
    .cell.drop {
      outline: 2px dashed var(--primary-color);
      outline-offset: 2px;
    }
    .cell.flash {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .cell.active {
      z-index: 9;
    }
    .label {
      font-weight: 500;
      font-size: 0.95em;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .summary {
      font-size: 0.7em;
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
      gap: 3px;
    }
    .kind {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid var(--divider-color, #444);
      font-size: 0.6em;
      opacity: 0.35;
    }
    .kind.on {
      opacity: 1;
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .cell.flash .kind.on {
      color: inherit;
      border-color: currentColor;
    }
    .kind.flash {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .badge {
      position: absolute;
      top: 2px;
      right: 6px;
      font-size: 0.65em;
    }
    .err {
      color: var(--error-color, #db4437);
      font-weight: 700;
    }
    .stale {
      color: var(--warning-color, #ffa600);
      font-size: 0.8em;
    }
    .chips {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .chip {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      box-sizing: border-box;
      padding: 3px 6px;
      border: 1px solid var(--divider-color, #444);
      border-radius: 6px;
      background: none;
      color: inherit;
      font: inherit;
      font-size: 0.75em;
      text-align: left;
      cursor: pointer;
      opacity: 0.5;
    }
    .chip.on {
      opacity: 1;
      border-color: var(--primary-color);
    }
    .chip.archived {
      border-style: dashed;
      opacity: 0.35;
    }
    .chip.flash {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .chip .icon {
      flex: none;
      width: 16px;
      text-align: center;
      font-weight: 600;
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
    .popover {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      max-width: 244px;
      padding: 8px;
      border-radius: 14px;
      background: var(--card-background-color, #222);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    .popover.above {
      bottom: calc(100% + 6px);
    }
    .popover.below {
      top: calc(100% + 6px);
    }
    .popover.edge-left {
      left: 0;
      transform: none;
    }
    .popover.edge-right {
      left: auto;
      right: 0;
      transform: none;
    }
    .opt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: 56px;
      cursor: pointer;
      opacity: 0.45;
    }
    .opt.on {
      opacity: 1;
    }
    .circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid var(--primary-color);
      font-weight: 600;
      pointer-events: none;
    }
    .opt-text {
      font-size: 0.65em;
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
      padding: 6px 12px;
      border-radius: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font-weight: 500;
      opacity: 0.9;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "remote-mapper-grid": RemoteMapperGrid;
  }
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * MS-Word style table picker: hover (or tap) a cell to preview rows×cols,
 * click to pick. The visible matrix grows as the pointer nears its edge
 * (5×5 → up to GRID_MAX²). Emits `grid-picked` {rows, cols}.
 */
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { GRID_MAX } from "./model";

const BASE_VISIBLE = 5;

@customElement("remote-mapper-grid-picker")
export class RemoteMapperGridPicker extends LitElement {
  /** Current shape — highlighted when nothing is hovered. */
  @property({ type: Number }) rows = 1;
  @property({ type: Number }) cols = 1;
  /** Button count: picking fewer cells is allowed, the card grows rows. */
  @property({ type: Number }) minCells = 1;

  @state() private _hover?: { r: number; c: number };

  protected override render() {
    const sel = this._hover ?? { r: this.rows - 1, c: this.cols - 1 };
    const visRows = Math.min(GRID_MAX, Math.max(BASE_VISIBLE, sel.r + 2, this.rows + 1));
    const visCols = Math.min(GRID_MAX, Math.max(BASE_VISIBLE, sel.c + 2, this.cols + 1));
    const cells = [];
    for (let r = 0; r < visRows; r++) {
      for (let c = 0; c < visCols; c++) {
        cells.push(html`
          <div
            class="cell ${r <= sel.r && c <= sel.c ? "on" : ""}"
            @pointerenter=${() => {
              this._hover = { r, c };
            }}
            @pointerdown=${() => {
              this._hover = { r, c };
            }}
            @click=${() => this._pick(r + 1, c + 1)}
          ></div>
        `);
      }
    }
    const picked = (sel.r + 1) * (sel.c + 1);
    return html`
      <div
        class="matrix"
        style="grid-template-columns: repeat(${visCols}, var(--ha-space-7, 28px))"
        @pointerleave=${() => {
          this._hover = undefined;
        }}
      >
        ${cells}
      </div>
      <div class="caption">
        ${sel.r + 1} rows × ${sel.c + 1} cols
        ${picked < this.minCells
          ? html`<span class="warn">· grows to fit ${this.minCells} buttons</span>`
          : ""}
      </div>
    `;
  }

  private _pick(rows: number, cols: number): void {
    this._hover = undefined;
    this.dispatchEvent(
      new CustomEvent("grid-picked", {
        detail: { rows, cols },
        bubbles: true,
        composed: true,
      })
    );
  }

  static override styles = css`
    :host {
      display: block;
      user-select: none;
      touch-action: manipulation;
    }
    .matrix {
      display: grid;
      gap: var(--ha-space-1, 4px);
    }
    .cell {
      width: var(--ha-space-7, 28px);
      height: var(--ha-space-7, 28px);
      box-sizing: border-box;
      border: 1px solid var(--divider-color, #666);
      border-radius: var(--ha-border-radius-sm, 4px);
      background: var(--card-background-color, transparent);
      cursor: pointer;
    }
    .cell.on {
      background: var(--primary-color);
      border-color: var(--primary-color);
      opacity: 0.85;
    }
    .caption {
      margin-top: var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .warn {
      color: var(--warning-color, #ffa600);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "remote-mapper-grid-picker": RemoteMapperGridPicker;
  }
}

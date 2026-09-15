/**
 * Grid model — server-derived buttons × stored cell positions.
 *
 * Pure functions only; the card and the grid element own the state. The
 * stored layout carries positions + optional label overrides, nothing
 * else (plan 04 §1.2): the button ↔ action grouping is always derived
 * server-side, so newly discovered actions land on the right button
 * without a layout change.
 */

export type Kind = "single" | "double" | "triple" | "hold" | "release" | "other";

export interface ButtonAction {
  action_id: string;
  event: string;
  kind: Kind;
}

export interface ButtonModel {
  id: string;
  label: string;
  actions: ButtonAction[];
}

export interface GridPos {
  row: number;
  col: number;
  label?: string;
}

export interface GridLayout {
  schema_version: number;
  rows: number;
  cols: number;
  buttons: Record<string, GridPos>;
}

export type DisplayMode = "normal" | "all" | "assisted";
export type LayoutKind = "grid" | "canvas";

export const GRID_SCHEMA_VERSION = 1;
/** Mirrors GRID_MAX in websocket.py. */
export const GRID_MAX = 12;

export const KIND_ICON: Record<Kind, string> = {
  single: "1",
  double: "2",
  triple: "3",
  hold: "⧗",
  release: "↥",
  other: "•",
};

export const KIND_TITLE: Record<Kind, string> = {
  single: "single press",
  double: "double press",
  triple: "triple press",
  hold: "hold",
  release: "release",
  other: "other",
};

const key = (row: number, col: number): string => `${row},${col}`;

/** Default shape for N buttons: 2 columns up to 6 (2×2, 2×3), √N beyond. */
export function autoDims(n: number): { rows: number; cols: number } {
  if (n <= 1) return { rows: 1, cols: 1 };
  const cols = n <= 6 ? 2 : Math.min(GRID_MAX, Math.ceil(Math.sqrt(n)));
  return { rows: Math.ceil(n / cols), cols };
}

/**
 * Stored layout (possibly absent, stale or out of range) + the current
 * button list → a complete layout: every button placed exactly once,
 * inside rows×cols. Unplaced buttons fill free cells in reading order,
 * growing rows when the grid is full. Label overrides survive re-flow.
 */
export function normalizeGrid(
  stored: GridLayout | null | undefined,
  buttons: ButtonModel[]
): GridLayout {
  const dims =
    stored && stored.rows > 0 && stored.cols > 0
      ? { rows: stored.rows, cols: stored.cols }
      : autoDims(buttons.length);
  const cols = Math.min(GRID_MAX, dims.cols);
  let rows = Math.min(GRID_MAX, dims.rows);
  const out: Record<string, GridPos> = {};
  const taken = new Set<string>();
  const unplaced: Array<{ id: string; label?: string }> = [];

  for (const b of buttons) {
    const pos = stored?.buttons?.[b.id];
    const label = pos?.label?.trim() ? { label: pos.label.trim() } : {};
    const inRange =
      pos &&
      Number.isInteger(pos.row) &&
      Number.isInteger(pos.col) &&
      pos.row >= 0 &&
      pos.col >= 0 &&
      pos.row < rows &&
      pos.col < cols;
    if (inRange && !taken.has(key(pos.row, pos.col))) {
      out[b.id] = { row: pos.row, col: pos.col, ...label };
      taken.add(key(pos.row, pos.col));
    } else {
      unplaced.push({ id: b.id, ...label });
    }
  }

  let cursor = 0;
  for (const b of unplaced) {
    for (;;) {
      const row = Math.floor(cursor / cols);
      const col = cursor % cols;
      cursor++;
      if (row >= rows) rows = row + 1;
      if (!taken.has(key(row, col))) {
        out[b.id] = { row, col, ...(b.label ? { label: b.label } : {}) };
        taken.add(key(row, col));
        break;
      }
    }
  }
  return { schema_version: GRID_SCHEMA_VERSION, rows, cols, buttons: out };
}

/** Change the shape; in-range buttons stay put, the rest re-flow. */
export function resizeGrid(
  layout: GridLayout,
  rows: number,
  cols: number,
  buttons: ButtonModel[]
): GridLayout {
  return normalizeGrid({ ...layout, rows, cols }, buttons);
}

/** "row,col" → button id. */
export function cellMap(layout: GridLayout): Map<string, string> {
  const map = new Map<string, string>();
  for (const [id, pos] of Object.entries(layout.buttons)) {
    map.set(key(pos.row, pos.col), id);
  }
  return map;
}

export function buttonAt(
  layout: GridLayout,
  row: number,
  col: number
): string | undefined {
  return cellMap(layout).get(key(row, col));
}

/** Move the button at `from` to `to`, swapping with any occupant. */
export function swapCells(
  layout: GridLayout,
  from: { row: number; col: number },
  to: { row: number; col: number }
): GridLayout {
  if (from.row === to.row && from.col === to.col) return layout;
  const map = cellMap(layout);
  const a = map.get(key(from.row, from.col));
  if (!a) return layout;
  const b = map.get(key(to.row, to.col));
  const buttons = { ...layout.buttons };
  buttons[a] = { ...buttons[a], row: to.row, col: to.col };
  if (b) buttons[b] = { ...buttons[b], row: from.row, col: from.col };
  return { ...layout, buttons };
}

export function setButtonLabel(
  layout: GridLayout,
  id: string,
  label: string
): GridLayout {
  const pos = layout.buttons[id];
  if (!pos) return layout;
  const { label: _old, ...rest } = pos;
  // kept as typed while editing (trailing space must survive the cursor);
  // trimLabels() runs before save
  return {
    ...layout,
    buttons: {
      ...layout.buttons,
      [id]: label.trim() ? { ...rest, label } : rest,
    },
  };
}

/** Trim label overrides (before persisting). */
export function trimLabels(layout: GridLayout): GridLayout {
  const buttons: Record<string, GridPos> = {};
  for (const [id, pos] of Object.entries(layout.buttons)) {
    const { label, ...rest } = pos;
    const trimmed = label?.trim();
    buttons[id] = trimmed ? { ...rest, label: trimmed } : rest;
  }
  return { ...layout, buttons };
}

export function buttonLabel(button: ButtonModel, layout: GridLayout): string {
  return layout.buttons[button.id]?.label || button.label;
}

/** First action of a kind, in the server's canonical order. */
export function actionOfKind(
  button: ButtonModel,
  kind: Kind
): ButtonAction | undefined {
  return button.actions.find((a) => a.kind === kind);
}

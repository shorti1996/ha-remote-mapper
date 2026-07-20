/**
 * Vendored from widget-canvas-ha src/model/migrate.ts — the snap/cell
 * helpers only (normalizeConfig stays upstream; our layout is
 * server-generated and already normalized).
 */

import type { CellSize } from "./types";

export const DEFAULT_CELL = 10;

export function snapSize(v: number, cell: number): number {
  return Math.max(cell, Math.round(v / cell) * cell);
}

export function snapPos(v: number, cell: number): number {
  return Math.round(v / cell) * cell;
}

/** Resolve a CellSize (number or {x,y}) into per-axis cell sizes. */
export function cellsOf(grid: { cell: CellSize }): { x: number; y: number } {
  const c = grid.cell;
  if (typeof c === "number" && Number.isFinite(c)) return { x: c, y: c };
  const o = (c ?? {}) as { x?: unknown; y?: unknown };
  const x = typeof o.x === "number" && Number.isFinite(o.x) ? o.x : DEFAULT_CELL;
  const y = typeof o.y === "number" && Number.isFinite(o.y) ? o.y : DEFAULT_CELL;
  return { x, y };
}

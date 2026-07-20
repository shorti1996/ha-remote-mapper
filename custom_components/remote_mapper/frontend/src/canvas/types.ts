/**
 * Vendored from widget-canvas-ha src/model/types.ts (no upstream release
 * exists yet — repo has no commits, so a tag-pinned npm git dependency is
 * not possible; see plan §1.13, fallback path). Adapted: single widget
 * kind "slot", config container renamed.
 */

export interface DesignSize {
  width: number;
  height: number;
}

/** One size for both axes, or independent horizontal (x) / vertical (y) cells. */
export type CellSize = number | { x: number; y: number };

export interface GridSettings {
  cell: CellSize;
  snap_position: boolean;
}

/** A slot tile on the canvas — id is the physical action id. */
export interface WidgetConfig {
  id: string;
  kind: "slot";
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
  [key: string]: unknown;
}

export interface CanvasLayout {
  schema_version: number;
  canvas_id?: string;
  design_size: DesignSize;
  grid: GridSettings;
  widgets: WidgetConfig[];
}

/** Alias so vendored engine files keep their upstream signatures. */
export type NormalizedConfig = CanvasLayout;

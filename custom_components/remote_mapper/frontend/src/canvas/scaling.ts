/**
 * Vendored from widget-canvas-ha src/render/scaling.ts (verbatim, section
 * constants inlined).
 */

import type { DesignSize } from "./types";

const SECTION_ROW_PX = 56;
const SECTION_GAP_PX = 8;

export interface CanvasTransform {
  /** uniform scale from canvas units to CSS px */
  scale: number;
  /** letterbox offsets in CSS px (non-zero only when height-constrained) */
  offsetX: number;
  offsetY: number;
  /** viewport height in CSS px the card should occupy */
  viewportHeight: number;
}

/** Pixel height HA gives a sections-grid card spanning `rows` rows. */
export function rowsToPx(rows: number): number {
  return rows * SECTION_ROW_PX + (rows - 1) * SECTION_GAP_PX;
}

/**
 * Width-driven by default: scale = hostWidth / design.width, height
 * follows aspect; with an externally fixed height, contain-fit both axes
 * and center (letterbox).
 */
export function computeTransform(
  design: DesignSize,
  hostWidth: number,
  fixedHeight: number | null
): CanvasTransform {
  const w = Math.max(1, hostWidth);
  if (fixedHeight === null) {
    const scale = w / design.width;
    return { scale, offsetX: 0, offsetY: 0, viewportHeight: design.height * scale };
  }
  const h = Math.max(1, fixedHeight);
  const scale = Math.min(w / design.width, h / design.height);
  return {
    scale,
    offsetX: (w - design.width * scale) / 2,
    offsetY: (h - design.height * scale) / 2,
    viewportHeight: h,
  };
}

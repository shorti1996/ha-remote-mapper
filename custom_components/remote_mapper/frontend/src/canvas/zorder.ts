// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Vendored from widget-canvas-ha src/model/zorder.ts (verbatim).
 * All ops return a NEW widget array with z re-normalized to 1..n
 * preserving relative order (DDC-proven semantics).
 */

import type { WidgetConfig } from "./types";

function sortedByZ(widgets: WidgetConfig[]): WidgetConfig[] {
  return widgets
    .map((w, i) => ({ w, i }))
    .sort((a, b) => (a.w.z ?? 0) - (b.w.z ?? 0) || a.i - b.i)
    .map((x) => x.w);
}

function renumber(ordered: WidgetConfig[], all: WidgetConfig[]): WidgetConfig[] {
  const zById = new Map<string, number>();
  ordered.forEach((w, i) => zById.set(w.id, i + 1));
  return all.map((w) => ({ ...w, z: zById.get(w.id) ?? w.z ?? 1 }));
}

export function normalizeZ(widgets: WidgetConfig[]): WidgetConfig[] {
  return renumber(sortedByZ(widgets), widgets);
}

export type ZOp = "forward" | "backward" | "front" | "back";

export function applyZOp(
  widgets: WidgetConfig[],
  id: string,
  op: ZOp
): WidgetConfig[] {
  const order = sortedByZ(widgets);
  const idx = order.findIndex((w) => w.id === id);
  if (idx === -1) return normalizeZ(widgets);
  const moved = order.splice(idx, 1)[0];
  switch (op) {
    case "forward":
      order.splice(Math.min(idx + 1, order.length), 0, moved);
      break;
    case "backward":
      order.splice(Math.max(idx - 1, 0), 0, moved);
      break;
    case "front":
      order.push(moved);
      break;
    case "back":
      order.unshift(moved);
      break;
  }
  return renumber(order, widgets);
}

export function maxZ(widgets: WidgetConfig[]): number {
  return widgets.reduce((m, w) => Math.max(m, w.z ?? 0), 0);
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Vendored from widget-canvas-ha src/editor/session.ts (verbatim).
 *
 * Module-level edit-session registry keyed by canvas id. Saving Lovelace
 * config rebuilds EVERY card in the view — the element is destroyed and
 * recreated mid-edit whenever any card saves. Keeping working state here
 * (the module instance survives; only elements are recreated) lets a
 * recreated instance re-attach and resume the edit session seamlessly.
 */

import type { WidgetConfig } from "./types";

export interface EditSession {
  canvasId: string;
  active: boolean;
  working: WidgetConfig[];
  original: WidgetConfig[];
  selectedId: string | null;
  undoStack: WidgetConfig[][];
  /** D-pad step mode: 1 canvas unit, or one grid cell per press (per axis) */
  dpadMode: "fine" | "cell";
}

const sessions = new Map<string, EditSession>();

export function getSession(canvasId: string | undefined): EditSession | undefined {
  return canvasId ? sessions.get(canvasId) : undefined;
}

export function createSession(
  canvasId: string,
  widgets: WidgetConfig[]
): EditSession {
  const session: EditSession = {
    canvasId,
    active: true,
    working: widgets,
    original: widgets.map((w) => ({ ...w })),
    selectedId: null,
    undoStack: [],
    dpadMode: "fine",
  };
  sessions.set(canvasId, session);
  return session;
}

export function endSession(canvasId: string | undefined): void {
  if (canvasId) sessions.delete(canvasId);
}

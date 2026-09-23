// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Grid edit drafts keyed by entry id. HA's card editor calls setConfig on
 * every form change and rebuilds the preview on Save, and in-app
 * navigation destroys the card element; the module instance outlives all
 * of that, so a recreated card resumes the edit instead of losing it.
 */
import type { GridLayout } from "./model";

const drafts = new Map<string, GridLayout>();

export function getGridDraft(entryId: string | undefined): GridLayout | undefined {
  return entryId ? drafts.get(entryId) : undefined;
}

export function setGridDraft(entryId: string | undefined, draft: GridLayout): void {
  if (entryId) drafts.set(entryId, draft);
}

export function clearGridDraft(entryId: string | undefined): void {
  if (entryId) drafts.delete(entryId);
}

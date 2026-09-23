// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Slot editor save rules that don't need the DOM.
 */

export interface LinkedSaveInput {
  /** The slot points at a native automation we don't own. */
  linked: boolean;
  /** "Keep linked" checkbox state. */
  keepLinked: boolean;
  /** Active editor tab. */
  tab: "quick" | "yaml";
  /** Quick tab's chosen action. */
  quickMode: string;
  /** Actions in the YAML editor (null = unparseable text). */
  draft: unknown[] | null;
  /** The automation's live actions, as fetched when the editor opened. */
  live: unknown[];
}

export const LINKED_EDIT_BLOCKED =
  "This event is linked to a native automation. Edit its actions in HA, " +
  'or untick "Keep linked" to absorb your changes into the card.';

/**
 * Why a save must be refused for a linked slot, or null when it may go on.
 *
 * With the link kept, the native automation stays canonical: re-linking
 * from the Quick tab is fine, a name-only save is fine, but a different
 * action or edited YAML would otherwise replace the link with a freshly
 * created owned automation.
 */
export function linkedSaveBlocker(input: LinkedSaveInput): string | null {
  if (!input.linked || !input.keepLinked) return null;
  if (input.tab === "quick") {
    return input.quickMode === "link" ? null : LINKED_EDIT_BLOCKED;
  }
  const same = JSON.stringify(input.draft ?? null) === JSON.stringify(input.live);
  return same ? null : LINKED_EDIT_BLOCKED;
}

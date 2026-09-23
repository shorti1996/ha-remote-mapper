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

/**
 * Unticking "Keep linked" on a linked slot absorbs it: the save carries
 * `materialized: false` and nothing else. Without this rule the Quick tab's
 * "Link existing automation" mode, which is where a linked slot opens,
 * re-sent `link_entity_id` and the untick was silently ignored.
 */
export function absorbsOnSave(input: Pick<LinkedSaveInput, "linked" | "keepLinked">): boolean {
  return input.linked && !input.keepLinked;
}

/**
 * A linked per-remote automation (one choose branch per event) as get_slot
 * reports it: HA can only turn it off as a whole.
 */
export interface WholeAutomation {
  /** This remote's events that have a branch in it. */
  events: string[];
  /** This remote's events linked to it. */
  linked: string[];
  /** It also runs on another remote's or device's triggers. */
  foreign: boolean;
  /** Why its branches can't move into the card, or null. */
  blocked: string | null;
}

export interface ConfirmText {
  title: string;
  text: string;
  confirmText: string;
}

/**
 * Dialog before unticking "Keep linked" on one event of a per-remote
 * automation: every event it runs moves into the card. Null when it runs
 * only this one event.
 */
export function wholeAbsorbConfirm(alias: string, events: string[]): ConfirmText | null {
  if (events.length < 2) return null;
  return {
    title: "Move the whole automation into the card?",
    text:
      `"${alias}" runs ${events.length} events on this remote: ${events.join(", ")}. ` +
      "Each one gets its own copy of its branch, and the automation is turned off " +
      "in HA (not deleted). Hand back turns it on again.",
    confirmText: `Move all ${events.length}`,
  };
}

/**
 * Dialog before disabling an event. A linked automation goes off in HA,
 * so every event linked to it stops with it.
 */
export function disableConfirm(
  name: string,
  opts: { automation: boolean; alias?: string; linked?: string[] }
): ConfirmText {
  const linked = opts.linked ?? [];
  const tail =
    linked.length > 1
      ? ` The automation "${opts.alias}" is turned off in HA, so all ${linked.length} ` +
        `events linked to it stop: ${linked.join(", ")}.`
      : opts.automation
        ? " Its automation is turned off in HA meanwhile."
        : "";
  return {
    title: linked.length > 1 ? `Disable ${linked.length} events?` : "Disable this event?",
    text: `"${name}" keeps its setup but stops running until you enable it again.${tail} Nothing is deleted.`,
    confirmText: linked.length > 1 ? `Disable all ${linked.length}` : "Disable",
  };
}

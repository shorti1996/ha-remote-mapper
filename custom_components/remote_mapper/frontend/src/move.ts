// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Targets for "Move to…" in the event editor: every other event of the
 * remote, grouped by button in grid order, with what a move there does.
 */
import {
  actionOfKind,
  buttonLabel,
  type ButtonModel,
  type GridLayout,
  type Kind,
} from "./model";
import type { SlotView } from "./remote-grid";

export interface MoveTarget {
  actionId: string;
  /** Event name as the pads show it (single, double, hold…). */
  event: string;
  /** The target already has an action: moving swaps the two. */
  swapWith?: string;
  /** Linked to a native automation — the backend refuses to move it. */
  linked: boolean;
}

export interface MoveGroup {
  buttonId: string;
  label: string;
  targets: MoveTarget[];
}

/**
 * Buttons in reading order of the layout (row, then column), each with its
 * events except `current`. A set target carries the summary it would swap
 * with; a linked one is listed so the reader sees why it is not offered.
 */
export function moveGroups(
  buttons: ButtonModel[],
  layout: GridLayout,
  slots: Record<string, SlotView>,
  linked: Set<string>,
  current: string
): MoveGroup[] {
  const ordered = [...buttons].sort((a, b) => {
    const pa = layout.buttons[a.id] ?? { row: Infinity, col: Infinity };
    const pb = layout.buttons[b.id] ?? { row: Infinity, col: Infinity };
    return pa.row - pb.row || pa.col - pb.col;
  });
  const groups: MoveGroup[] = [];
  for (const button of ordered) {
    const targets: MoveTarget[] = [];
    for (const action of button.actions) {
      if (action.action_id === current) continue;
      const view = slots[action.action_id];
      targets.push({
        actionId: action.action_id,
        event: action.event,
        swapWith: view?.assigned ? view.summary : undefined,
        linked: linked.has(action.action_id),
      });
    }
    if (targets.length) {
      groups.push({ buttonId: button.id, label: buttonLabel(button, layout), targets });
    }
  }
  return groups;
}

/** What the pointer is over while an event mark is being dragged. */
export interface DropHit {
  /** An event mark or chip under the pointer. */
  actionId?: string;
  /** Else the pad under the pointer. */
  buttonId?: string;
}

/**
 * Where a dragged action would land, or undefined when the drop is not
 * allowed. A mark or chip is that event; a pad is the same kind of event
 * on that button (1 single → 3 single). The source itself and linked
 * targets are not drop targets.
 */
export function dropTargetFor(
  hit: DropHit,
  source: { actionId: string; kind: Kind },
  buttons: ButtonModel[],
  linked: Set<string>
): string | undefined {
  let target = hit.actionId;
  if (!target && hit.buttonId) {
    const button = buttons.find((b) => b.id === hit.buttonId);
    target = button ? actionOfKind(button, source.kind)?.action_id : undefined;
  }
  if (!target || target === source.actionId || linked.has(target)) return undefined;
  return target;
}

/** Option text for one target. */
export function moveTargetLabel(target: MoveTarget): string {
  if (target.linked) return `${target.event} — linked, can't swap`;
  if (target.swapWith) return `${target.event} — swap with "${target.swapWith}"`;
  return target.event;
}

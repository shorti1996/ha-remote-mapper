// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Targets for "Move to…" in the event editor: every other event of the
 * remote, grouped by button in grid order, with what a move there does;
 * then every event of every other remote (plan ai/08). Plus the hit
 * test a dragged mark uses to find a pad on another remote's card.
 */
import {
  actionOfKind,
  buttonLabel,
  normalizeGrid,
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
}

export interface MoveGroup {
  buttonId: string;
  label: string;
  targets: MoveTarget[];
  /** The remote the targets belong to; "" for the current one. */
  entryId: string;
}

/**
 * Buttons in reading order of the layout (row, then column), each with its
 * events except `current`. A set target carries the summary it would swap
 * with. `entryId` names another remote: its groups are labelled with
 * `title` so a flat <select> still reads as "which remote, which button".
 */
export function moveGroups(
  buttons: ButtonModel[],
  layout: GridLayout,
  slots: Record<string, SlotView>,
  current: string,
  entryId = "",
  title?: string
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
      });
    }
    if (targets.length) {
      const label = buttonLabel(button, layout);
      groups.push({
        buttonId: button.id,
        label: title ? `${title} · ${label}` : label,
        targets,
        entryId,
      });
    }
  }
  return groups;
}

/** What the picker needs of another remote: get_remote, as the card holds it. */
export interface OtherRemote {
  entry_id: string;
  title: string;
  buttons?: ButtonModel[];
  grid_layout?: GridLayout | null;
}

/**
 * Every event of every other remote, as groups after the current remote's
 * own. `views` gives a remote's slot summaries for the swap labels.
 */
export function otherRemoteGroups(
  remotes: OtherRemote[],
  views: (remote: OtherRemote) => Record<string, SlotView>
): MoveGroup[] {
  return remotes.flatMap((remote) => {
    const buttons = remote.buttons ?? [];
    const layout = normalizeGrid(remote.grid_layout, buttons);
    return moveGroups(buttons, layout, views(remote), "", remote.entry_id, remote.title);
  });
}

/**
 * The deepest element at a viewport point, drilling through open shadow
 * roots from `root` (usually the document). `elementFromPoint` on a
 * shadow root sees only its own tree, so a card looking for another
 * card's grid under the pointer has to walk down from the document.
 */
export function deepElementAt(root: DocumentOrShadowRoot, x: number, y: number): Element | null {
  let el = root.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

/** The nearest shadow host of `el` that satisfies `test`, else undefined. */
export function hostOf<T extends Element>(
  el: Element | null,
  test: (host: Element) => host is T
): T | undefined {
  let node: Node | null = el;
  while (node) {
    const root = node.getRootNode();
    if (!(root instanceof ShadowRoot)) return undefined;
    if (test(root.host)) return root.host;
    node = root.host;
  }
  return undefined;
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
 * on that button (1 single → 3 single). The source itself is not a drop
 * target; a source from another remote's card has no `actionId` here,
 * since two remotes name their events alike (both have a `1_single`).
 */
export function dropTargetFor(
  hit: DropHit,
  source: { actionId?: string; kind: Kind },
  buttons: ButtonModel[]
): string | undefined {
  let target = hit.actionId;
  if (!target && hit.buttonId) {
    const button = buttons.find((b) => b.id === hit.buttonId);
    target = button ? actionOfKind(button, source.kind)?.action_id : undefined;
  }
  if (!target || target === source.actionId) return undefined;
  return target;
}

/** Option text for one target. */
export function moveTargetLabel(target: MoveTarget): string {
  if (target.swapWith) return `${target.event} — swap with "${target.swapWith}"`;
  return target.event;
}

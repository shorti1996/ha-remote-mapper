// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Grouping overrides (plan ai/09): which button an action sits on and
 * which press kind it is, for remotes whose action names the server
 * cannot split. The server does the grouping; these helpers only feed
 * the button sheet's controls.
 */
import {
  buttonLabel,
  KIND_ICON,
  KIND_TITLE,
  KINDS,
  type ButtonModel,
  type GridLayout,
  type Kind,
} from "./model";

/** One override, as get_remote returns it under `grouping`. */
export interface GroupingEntry {
  button?: string;
  kind?: Kind;
}
export type Grouping = Record<string, GroupingEntry>;

export interface KindOption {
  kind: Kind;
  /** Option text: the text mark and the title; an mdi: mark cannot render in a <select>. */
  label: string;
}

/** The six kinds for the press-kind select, in mark order. */
export function kindOptions(kindIcons: Record<Kind, string> = KIND_ICON): KindOption[] {
  return KINDS.map((kind) => {
    const mark = kindIcons[kind];
    const text = mark && !mark.startsWith("mdi:") ? `${mark} ${KIND_TITLE[kind]}` : KIND_TITLE[kind];
    return { kind, label: text };
  });
}

export interface MoveButtonTarget {
  id: string;
  label: string;
}

/** Every other button in reading order of the layout, by its label. */
export function moveTargets(
  buttons: ButtonModel[],
  layout: GridLayout,
  currentId: string
): MoveButtonTarget[] {
  return [...buttons]
    .filter((b) => b.id !== currentId)
    .sort((a, b) => {
      const pa = layout.buttons[a.id] ?? { row: Infinity, col: Infinity };
      const pb = layout.buttons[b.id] ?? { row: Infinity, col: Infinity };
      return pa.row - pb.row || pa.col - pb.col;
    })
    .map((b) => ({ id: b.id, label: buttonLabel(b, layout) }));
}

/** The action sits where the user put it, not where the server derived it. */
export function isOverride(grouping: Grouping | undefined, actionId: string): boolean {
  return !!grouping && actionId in grouping;
}

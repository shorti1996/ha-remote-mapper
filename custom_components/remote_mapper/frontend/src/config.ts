// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/** Dashboard-side card config (per card instance, lives in Lovelace). */
import { KIND_ICON, KINDS, type DisplayMode, type Kind, type LayoutKind } from "./model";

export type AssistedTrigger = "auto" | "tap" | "press";
export type ChipsLayout = "vertical" | "horizontal" | "compact" | "spines" | "grid";

export interface RemoteMapperCardConfig {
  type: string;
  entry_id?: string;
  /** Header text; empty = the remote's name. */
  title?: string;
  /** false hides the title text (header keeps its buttons). */
  show_title?: boolean;
  /** grid (default) — button grid; canvas — free-drag tiles, one per event. */
  layout?: LayoutKind;
  /** Grid only: assisted (default, popover), replica (physical remote), all (every event). */
  display?: DisplayMode;
  /** assisted only: auto (touch → press, mouse → tap), tap, or press (Pinterest). */
  assisted_trigger?: AssistedTrigger;
  /** all only: how a button's event chips are arranged. */
  chips_layout?: ChipsLayout;
  /** all only: leave out chips with nothing assigned (edit mode shows them). */
  hide_unset?: boolean;
  /** Appearance — "#rrggbb" from the picker, or any CSS color / theme var in YAML. */
  button_color?: string;
  accent_color?: string;
  text_color?: string;
  /** Pad background opacity 0.1–1 (text and accent stay solid). */
  button_opacity?: number;
  /** Event marks per kind: "mdi:…" for an icon, any other text as is; unset = 1 / 2 / 3 / ⧗ / ↥ / •. */
  event_icons?: Partial<Record<Kind, string>>;
  [key: string]: unknown;
}

/** The mark for every kind: the card's override, else the default text. */
export function eventIconsOf(config: RemoteMapperCardConfig | undefined): Record<Kind, string> {
  const out = { ...KIND_ICON };
  const icons = config?.event_icons;
  if (icons && typeof icons === "object") {
    for (const kind of KINDS) {
      const value = icons[kind];
      if (typeof value === "string" && value.trim()) out[kind] = value.trim();
    }
  }
  return out;
}

export const DISPLAY_MODES: Array<{ value: DisplayMode; label: string }> = [
  { value: "assisted", label: "Assisted — press a button, pick the event" },
  { value: "replica", label: "Replica — tap / double-tap / hold like the physical remote" },
  { value: "all", label: "All visible — every event of every button" },
];

export const LAYOUT_KINDS: Array<{ value: LayoutKind; label: string }> = [
  { value: "grid", label: "Grid — buttons arranged like the remote" },
  { value: "canvas", label: "Canvas — free placement, one tile per event" },
];

export const ASSISTED_TRIGGERS: Array<{ value: AssistedTrigger; label: string }> = [
  { value: "auto", label: "Auto — slide with a finger, tap with a mouse" },
  { value: "tap", label: "Tap opens, tap again closes; tap an option" },
  { value: "press", label: "Long-press opens; slide to an option and lift" },
];

export const CHIPS_LAYOUTS: Array<{ value: ChipsLayout; label: string }> = [
  { value: "vertical", label: "Vertical list" },
  { value: "horizontal", label: "Wrapped row — chips flow like tags" },
  { value: "compact", label: "Compact icons — one row, name on hover / long-press" },
  { value: "spines", label: "Spines — one row, names rotated 90°" },
  { value: "grid", label: "Two-column grid" },
];

export function displayOf(config: RemoteMapperCardConfig | undefined): DisplayMode {
  // "normal" was the pre-release name of replica — keep old dashboards working
  const raw: unknown = config?.display;
  const value = raw === "normal" ? "replica" : raw;
  return DISPLAY_MODES.some((m) => m.value === value) ? (value as DisplayMode) : "assisted";
}

export function layoutOf(config: RemoteMapperCardConfig | undefined): LayoutKind {
  return config?.layout === "canvas" ? "canvas" : "grid";
}

export function assistedTriggerOf(
  config: RemoteMapperCardConfig | undefined
): AssistedTrigger {
  const value = config?.assisted_trigger;
  return value === "press" || value === "tap" ? value : "auto";
}

export function chipsLayoutOf(config: RemoteMapperCardConfig | undefined): ChipsLayout {
  const value = config?.chips_layout;
  return CHIPS_LAYOUTS.some((c) => c.value === value) ? (value as ChipsLayout) : "vertical";
}

/** hide_unset applies to the all-visible display only. */
export function hideUnsetOf(config: RemoteMapperCardConfig | undefined): boolean {
  return displayOf(config) === "all" && config?.hide_unset === true;
}

/** "#rrggbb" → [r, g, b] for HA's color_rgb selector; anything else → undefined. */
export function hexToRgb(value: unknown): [number, number, number] | undefined {
  if (typeof value !== "string") return undefined;
  const m = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return undefined;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb: unknown): string | undefined {
  if (!Array.isArray(rgb) || rgb.length !== 3) return undefined;
  const hex = rgb.map((c) => Math.max(0, Math.min(255, Number(c) | 0)).toString(16).padStart(2, "0"));
  return `#${hex.join("")}`;
}

/** Editor sentinel for "no entry_id — use the only remote". */
export const AUTO_REMOTE = "__auto__";
export const COLOR_KEYS = ["button_color", "accent_color", "text_color"] as const;
const DEFAULT_PICKER_COLOR = "#3f51b5";

/** What the editor form shows for a config (defaults filled in). */
export function editorValue(config: RemoteMapperCardConfig): Record<string, unknown> {
  return {
    entry_id: config.entry_id || AUTO_REMOTE,
    title: config.title ?? "",
    show_title: config.show_title !== false,
    layout: layoutOf(config),
    display: displayOf(config),
    assisted_trigger: assistedTriggerOf(config),
    chips_layout: chipsLayoutOf(config),
    hide_unset: config.hide_unset === true,
    button_color_set: !!config.button_color,
    accent_color_set: !!config.accent_color,
    text_color_set: !!config.text_color,
    button_color: hexToRgb(config.button_color) ?? [63, 81, 181],
    accent_color: hexToRgb(config.accent_color) ?? [63, 81, 181],
    text_color: hexToRgb(config.text_color) ?? [255, 255, 255],
    button_opacity: config.button_opacity ?? 1,
    event_icons: Object.fromEntries(
      KINDS.map((kind) => [kind, config.event_icons?.[kind] ?? ""])
    ),
  };
}

/**
 * Fold an ha-form value back into the card config: defaults are dropped
 * (so YAML stays minimal), strings are trimmed, keys the editor doesn't
 * own (HA's grid_options, visibility, …) are preserved untouched.
 */
export function applyEditorValue(
  config: RemoteMapperCardConfig,
  value: Record<string, unknown>
): RemoteMapperCardConfig {
  const next: RemoteMapperCardConfig = { ...config, type: config.type };
  const set = (key: string, v: unknown, isDefault: boolean) => {
    if (v === undefined || v === "" || isDefault) delete next[key];
    else next[key] = v;
  };
  set("entry_id", value.entry_id, value.entry_id === AUTO_REMOTE);
  // Not trimmed while typing (a trailing space would vanish under the
  // cursor); whitespace-only counts as empty.
  set("title", value.title, typeof value.title === "string" && !value.title.trim());
  set("show_title", value.show_title, value.show_title !== false);
  set("layout", value.layout, value.layout !== "canvas");
  set("display", value.display, value.display === "assisted");
  set("assisted_trigger", value.assisted_trigger, value.assisted_trigger === "auto");
  set("chips_layout", value.chips_layout, value.chips_layout === "vertical");
  set("hide_unset", value.hide_unset, value.hide_unset !== true);
  for (const key of COLOR_KEYS) {
    if (!value[`${key}_set`]) {
      delete next[key];
      continue;
    }
    const picked = rgbToHex(value[key]);
    const existing = typeof next[key] === "string" ? (next[key] as string) : undefined;
    // A YAML-only value (theme var, rgba()) can't be shown by the picker,
    // which then holds the seed default — an untouched picker must not
    // overwrite it. Switch just turned on: seed so the field shows.
    if (existing && !hexToRgb(existing) && (!picked || picked === DEFAULT_PICKER_COLOR)) {
      continue;
    }
    next[key] = picked ?? existing ?? DEFAULT_PICKER_COLOR;
  }
  const opacity = value.button_opacity;
  set("button_opacity", opacity, typeof opacity !== "number" || opacity >= 1);
  // Marks: only the kinds that were set, trimmed; none set = no key at all
  const rawIcons = value.event_icons;
  const icons: Partial<Record<Kind, string>> = {};
  if (rawIcons && typeof rawIcons === "object") {
    for (const kind of KINDS) {
      const v = (rawIcons as Record<string, unknown>)[kind];
      if (typeof v === "string" && v.trim()) icons[kind] = v.trim();
    }
  }
  set("event_icons", icons, Object.keys(icons).length === 0);
  return next;
}

/**
 * Trim free-text fields; empty ones are dropped. Run when a field loses
 * focus (typing keeps spaces, see applyEditorValue). Returns the same
 * object when nothing changes so callers can skip re-emitting.
 */
export function trimConfigStrings(config: RemoteMapperCardConfig): RemoteMapperCardConfig {
  let changed = false;
  const next: RemoteMapperCardConfig = { ...config };
  for (const key of ["title", ...COLOR_KEYS] as const) {
    const v = next[key];
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed === v) continue;
    changed = true;
    if (trimmed) next[key] = trimmed;
    else delete next[key];
  }
  return changed ? next : config;
}

/**
 * Inline CSS custom properties for the grid element. Unset values fall
 * through to theme variables (--remote-mapper-*) and then HA defaults.
 */
export function styleVarsOf(config: RemoteMapperCardConfig | undefined): string {
  const vars: string[] = [];
  const color = (name: string, value: unknown) => {
    if (typeof value === "string" && value.trim()) vars.push(`${name}:${value.trim()}`);
  };
  color("--rm-button-bg", config?.button_color);
  color("--rm-accent", config?.accent_color);
  color("--rm-text", config?.text_color);
  const opacity = config?.button_opacity;
  if (typeof opacity === "number" && opacity > 0 && opacity < 1) {
    vars.push(`--rm-opacity:${opacity}`);
  }
  return vars.join(";");
}

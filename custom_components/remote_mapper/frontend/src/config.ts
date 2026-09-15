/** Dashboard-side card config (per card instance, lives in Lovelace). */
import type { DisplayMode, LayoutKind } from "./model";

export type AssistedTrigger = "auto" | "tap" | "press";
export type ChipsLayout = "vertical" | "horizontal" | "grid";

export interface RemoteMapperCardConfig {
  type: string;
  entry_id?: string;
  /** grid (default) — button grid; canvas — legacy free-drag tiles. */
  layout?: LayoutKind;
  /** Grid only: normal (physical remote), all (every event), assisted (popover). */
  display?: DisplayMode;
  /** assisted only: auto (touch → press, mouse → tap), tap, or press (Pinterest). */
  assisted_trigger?: AssistedTrigger;
  /** all only: how a button's event chips are arranged. */
  chips_layout?: ChipsLayout;
  /** Appearance — any CSS color; opacity 0.1–1. Theme vars work too. */
  button_color?: string;
  accent_color?: string;
  text_color?: string;
  button_opacity?: number;
  [key: string]: unknown;
}

export const DISPLAY_MODES: Array<{ value: DisplayMode; label: string }> = [
  { value: "normal", label: "Normal — tap/double-tap/hold like the physical remote" },
  { value: "all", label: "All visible — every event of every button" },
  { value: "assisted", label: "Assisted — press a button, pick the event" },
];

export const LAYOUT_KINDS: Array<{ value: LayoutKind; label: string }> = [
  { value: "grid", label: "Grid — buttons arranged like the remote" },
  { value: "canvas", label: "Canvas — free-drag tiles (legacy)" },
];

export const ASSISTED_TRIGGERS: Array<{ value: AssistedTrigger; label: string }> = [
  { value: "auto", label: "Auto — slide with a finger, tap with a mouse" },
  { value: "tap", label: "Tap opens, tap again closes; tap an option" },
  { value: "press", label: "Press opens; slide to an option and lift" },
];

export const CHIPS_LAYOUTS: Array<{ value: ChipsLayout; label: string }> = [
  { value: "vertical", label: "Vertical list" },
  { value: "horizontal", label: "Horizontal row" },
  { value: "grid", label: "Two-column grid" },
];

export function displayOf(config: RemoteMapperCardConfig | undefined): DisplayMode {
  const value = config?.display;
  return DISPLAY_MODES.some((m) => m.value === value) ? (value as DisplayMode) : "normal";
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

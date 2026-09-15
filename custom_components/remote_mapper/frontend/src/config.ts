/** Dashboard-side card config (per card instance, lives in Lovelace). */
import type { DisplayMode, LayoutKind } from "./model";

export interface RemoteMapperCardConfig {
  type: string;
  entry_id?: string;
  /** grid (default) — button grid; canvas — legacy free-drag tiles. */
  layout?: LayoutKind;
  /** Grid only: normal (physical remote), all (every event), assisted (popover). */
  display?: DisplayMode;
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

export function displayOf(config: RemoteMapperCardConfig | undefined): DisplayMode {
  const value = config?.display;
  return DISPLAY_MODES.some((m) => m.value === value) ? (value as DisplayMode) : "normal";
}

export function layoutOf(config: RemoteMapperCardConfig | undefined): LayoutKind {
  return config?.layout === "canvas" ? "canvas" : "grid";
}

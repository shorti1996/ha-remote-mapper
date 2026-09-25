// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * One event mark: an mdi icon when the value is "mdi:…", else the text
 * as is (the 1 / 2 / 3 / ⧗ / ↥ / • defaults, or whatever was typed).
 */
import { html, type TemplateResult } from "lit";

export function isIconMark(value: string): boolean {
  return value.startsWith("mdi:");
}

export function renderMark(value: string): TemplateResult | string {
  return isIconMark(value) ? html`<ha-icon class="mark-icon" icon=${value}></ha-icon>` : value;
}

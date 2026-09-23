// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Bundle-vs-backend version logic behind the "reload your browser" prompt.
 * Pure so it can be tested in node; the card wires it to the UI.
 */

/** Replaced by rollup with package.json's version; unbuilt source keeps the marker. */
export const CARD_VERSION = "__CARD_VERSION__";

/** Numeric compare of dotted versions: <0 a older, >0 a newer, 0 equal. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export type BundleStatus =
  /** versions match, or nothing to compare against */
  | "current"
  /** backend is newer: this tab runs an old bundle — reload */
  | "stale"
  /** bundle is newer than the backend: files updated, HA not restarted */
  | "ahead";

export function bundleStatus(
  bundle: string,
  backend: string | undefined
): BundleStatus {
  if (!backend || bundle.startsWith("__") || backend === bundle) return "current";
  return compareVersions(bundle, backend) > 0 ? "ahead" : "stale";
}

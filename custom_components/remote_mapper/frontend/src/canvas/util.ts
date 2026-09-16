// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Vendored from widget-canvas-ha src/util/hash.ts + src/util/uuid.ts
 * (verbatim; see types.ts header for why vendored).
 */

/** Deterministic JSON stringify (sorted object keys, stable across key order). */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortValue(v);
    }
    return out;
  }
  return value;
}

export function deepClone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    c.getRandomValues(out);
  } else {
    for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}

/** Short crypto-random hex id — readable in YAML. */
export function shortId(bytes = 4): string {
  return Array.from(randomBytes(bytes), (x) =>
    x.toString(16).padStart(2, "0")
  ).join("");
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Human text for whatever a failed call throws.
 *
 * hass.callWS rejects with a plain `{code, message}` object, which
 * `String(err)` turns into "[object Object]"; Errors carry a message;
 * anything else is stringified as a last resort. The card's not-found
 * case (a dashboard card pointing at a remote that was removed) gets a
 * hint about where to fix it.
 */
export function errorText(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { code?: unknown; message?: unknown };
    const message = typeof e.message === "string" && e.message ? e.message : undefined;
    if (e.code === "not_found") {
      return `${message ?? "Remote not found"} — it was removed or never existed. Open the card editor and pick another remote.`;
    }
    if (message) return message;
    if (err instanceof Error) return err.message || err.name;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * The last remote payload each card rendered, kept per browser so the
 * next page load draws the card at its final size at once, before the
 * live fetch answers. The live data replaces it; the copy is only ever
 * as old as the last visit.
 */

const PREFIX = "remote_mapper_remote:";
/** A card without entry_id shows the only remote; cached under this key. */
export const ONLY_REMOTE = "only";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** The cached payload for a remote, or undefined (none, junk, no storage). */
export function readRemoteCache<T extends { entry_id: string }>(
  key: string,
  store: StorageLike | undefined = storage()
): T | undefined {
  try {
    const raw = store?.getItem(PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("entry_id" in parsed)) return undefined;
    return parsed as T;
  } catch {
    return undefined;
  }
}

/** Remember the payload under its entry id (and as the only remote, if so). */
export function writeRemoteCache(
  remote: { entry_id: string },
  onlyRemote: boolean,
  store: StorageLike | undefined = storage()
): void {
  try {
    const raw = JSON.stringify(remote);
    store?.setItem(PREFIX + remote.entry_id, raw);
    if (onlyRemote) store?.setItem(PREFIX + ONLY_REMOTE, raw);
  } catch {
    /* quota or blocked storage: the next load draws "Loading…" as before */
  }
}

/** Forget a remote's copy (it no longer exists). */
export function clearRemoteCache(key: string, store: StorageLike | undefined = storage()): void {
  try {
    store?.removeItem(PREFIX + key);
  } catch {
    /* nothing to forget */
  }
}

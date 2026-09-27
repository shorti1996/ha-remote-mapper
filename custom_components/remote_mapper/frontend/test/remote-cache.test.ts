// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  clearRemoteCache,
  ONLY_REMOTE,
  readRemoteCache,
  writeRemoteCache,
} from "../src/remote-cache";

function memory() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    size: () => m.size,
  };
}

const remote = { entry_id: "e1", title: "Desk", slots: {} };

describe("remote cache", () => {
  it("round-trips a payload by entry id", () => {
    const store = memory();
    writeRemoteCache(remote, false, store);
    expect(readRemoteCache("e1", store)).toEqual(remote);
    expect(readRemoteCache(ONLY_REMOTE, store)).toBeUndefined();
  });

  it("also files the only remote under its own key", () => {
    const store = memory();
    writeRemoteCache(remote, true, store);
    expect(readRemoteCache(ONLY_REMOTE, store)).toEqual(remote);
    clearRemoteCache("e1", store);
    expect(readRemoteCache("e1", store)).toBeUndefined();
    expect(readRemoteCache(ONLY_REMOTE, store)).toEqual(remote);
  });

  it("ignores junk and missing storage", () => {
    const store = memory();
    store.setItem("remote_mapper_remote:e1", "{not json");
    expect(readRemoteCache("e1", store)).toBeUndefined();
    store.setItem("remote_mapper_remote:e1", JSON.stringify({ title: "no id" }));
    expect(readRemoteCache("e1", store)).toBeUndefined();
    expect(readRemoteCache("e1", undefined)).toBeUndefined();
    writeRemoteCache(remote, true, undefined);
  });
});

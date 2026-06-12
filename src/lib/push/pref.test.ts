import { describe, it, expect, beforeEach } from "vitest";
import {
  readPushPref,
  setPushPref,
  clearPushPref,
  subscribe,
} from "./pref";

function memoryStorage(): Storage {
  let map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => {
      map = new Map();
    },
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
  } as Storage;
}

let storage: Storage;
beforeEach(() => {
  storage = memoryStorage();
});

describe("push preference store", () => {
  it("defaults to opted out with no token", () => {
    expect(readPushPref(storage)).toEqual({ optedIn: false });
  });

  it("persists an opt-in with the device token", () => {
    setPushPref({ optedIn: true, token: "abc123" }, storage);
    expect(readPushPref(storage)).toEqual({ optedIn: true, token: "abc123" });
  });

  it("clears back to opted out", () => {
    setPushPref({ optedIn: true, token: "abc123" }, storage);
    clearPushPref(storage);
    expect(readPushPref(storage)).toEqual({ optedIn: false });
  });

  it("falls back to the default on corrupt storage", () => {
    storage.setItem("tnhc:push-optin", "nope{");
    expect(readPushPref(storage)).toEqual({ optedIn: false });
  });

  it("notifies subscribers on change", () => {
    let calls = 0;
    const unsub = subscribe(() => calls++);
    setPushPref({ optedIn: true, token: "t" }, storage);
    clearPushPref(storage);
    unsub();
    setPushPref({ optedIn: true, token: "t2" }, storage);
    expect(calls).toBe(2);
  });
});

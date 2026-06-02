import { describe, it, expect, beforeEach } from "vitest";
import {
  readRegions,
  saveRegion,
  removeRegion,
  clearRegions,
  subscribe,
  type OfflineRegion,
} from "./offline-regions";

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

const region = (over: Partial<OfflineRegion> = {}): OfflineRegion => ({
  id: "r1",
  name: "Obed",
  bounds: { west: -84.05, south: 35.9, east: -83.85, north: 36.05 },
  minZoom: 10,
  maxZoom: 14,
  tileCount: 320,
  savedAt: "2026-06-01T12:00:00.000Z",
  ...over,
});

let storage: Storage;
beforeEach(() => {
  storage = memoryStorage();
});

describe("offline-regions store", () => {
  it("starts empty", () => {
    expect(readRegions(storage)).toEqual([]);
  });

  it("saves a region and reads it back", () => {
    saveRegion(region(), storage);
    expect(readRegions(storage)).toEqual([region()]);
  });

  it("keeps the most recently saved region first", () => {
    saveRegion(region({ id: "a", name: "A" }), storage);
    saveRegion(region({ id: "b", name: "B" }), storage);
    expect(readRegions(storage).map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("replaces a region saved again under the same id (no duplicate)", () => {
    saveRegion(region({ id: "a", tileCount: 1 }), storage);
    saveRegion(region({ id: "a", tileCount: 9 }), storage);
    const all = readRegions(storage);
    expect(all).toHaveLength(1);
    expect(all[0].tileCount).toBe(9);
  });

  it("removes a region by id", () => {
    saveRegion(region({ id: "a" }), storage);
    saveRegion(region({ id: "b" }), storage);
    removeRegion("a", storage);
    expect(readRegions(storage).map((r) => r.id)).toEqual(["b"]);
  });

  it("clears every region", () => {
    saveRegion(region({ id: "a" }), storage);
    saveRegion(region({ id: "b" }), storage);
    clearRegions(storage);
    expect(readRegions(storage)).toEqual([]);
  });

  it("ignores corrupt storage", () => {
    storage.setItem("tnhc:offline-regions", "{not json");
    expect(readRegions(storage)).toEqual([]);
  });

  it("notifies subscribers when regions change", () => {
    let calls = 0;
    const unsub = subscribe(() => calls++);
    saveRegion(region(), storage);
    removeRegion("r1", storage);
    unsub();
    saveRegion(region({ id: "z" }), storage);
    expect(calls).toBe(2);
  });
});

import { describe, it, expect } from "vitest";
import { readLog, addHike, removeTrail, isHiked } from "./local-log";

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe("local hike log", () => {
  it("starts empty and records a hike", () => {
    const s = memStorage();
    expect(readLog(s)).toEqual([]);
    expect(isHiked("radnor-lake", s)).toBe(false);

    addHike("radnor-lake", "2026-05-20", undefined, s);
    expect(isHiked("radnor-lake", s)).toBe(true);
    expect(readLog(s)).toEqual([
      { trailSlug: "radnor-lake", hikedOn: "2026-05-20" },
    ]);
  });

  it("allows logging the same trail more than once", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", undefined, s);
    addHike("a", "2026-02-01", undefined, s);
    expect(readLog(s)).toHaveLength(2);
  });

  it("removes every entry for a trail", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", undefined, s);
    addHike("a", "2026-02-01", undefined, s);
    addHike("b", "2026-03-01", undefined, s);
    removeTrail("a", s);
    expect(isHiked("a", s)).toBe(false);
    expect(readLog(s).map((e) => e.trailSlug)).toEqual(["b"]);
  });

  it("returns an empty log for corrupt storage", () => {
    const s = memStorage();
    s.setItem("thc:hike-log", "{not json");
    expect(readLog(s)).toEqual([]);
  });

  it("stores an optional note and conditions, trimming the note", () => {
    const s = memStorage();
    addHike(
      "a",
      "2026-01-01",
      { note: "  wildflowers everywhere  ", conditions: "Muddy" },
      s,
    );
    expect(readLog(s)[0]).toMatchObject({
      trailSlug: "a",
      hikedOn: "2026-01-01",
      note: "wildflowers everywhere",
      conditions: "Muddy",
    });
  });

  it("omits empty details", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", { note: "   ", conditions: "" }, s);
    const entry = readLog(s)[0];
    expect(entry.note).toBeUndefined();
    expect(entry.conditions).toBeUndefined();
  });
});

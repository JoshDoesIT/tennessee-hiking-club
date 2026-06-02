import { describe, it, expect, vi } from "vitest";
import {
  readLog,
  addHike,
  removeTrail,
  removeHike,
  isHiked,
  setEntryPhotoUrl,
} from "./local-log";
import { deletePhoto } from "./photo-store";

vi.mock("./photo-store", () => ({ deletePhoto: vi.fn() }));

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

  it("stores a recorded track on the entry when provided", () => {
    const s = memStorage();
    const track = {
      points: [
        { lat: 35.6, lng: -83.45, elevationFt: 1000 },
        { lat: 35.62, lng: -83.44, elevationFt: 1200 },
      ],
      durationMin: 90,
    };
    addHike("grotto-falls", "2026-05-30", { track }, s);
    expect(readLog(s)).toEqual([
      { trailSlug: "grotto-falls", hikedOn: "2026-05-30", track },
    ]);
  });

  it("allows logging the same trail more than once", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", undefined, s);
    addHike("a", "2026-02-01", undefined, s);
    expect(readLog(s)).toHaveLength(2);
  });

  it("removes a single hike by trail and date, keeping the trail's others", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", undefined, s);
    addHike("a", "2026-02-01", undefined, s);
    addHike("b", "2026-03-01", undefined, s);
    removeHike("a", "2026-01-01", s);
    expect(readLog(s).map((e) => `${e.trailSlug}|${e.hikedOn}`)).toEqual([
      "a|2026-02-01",
      "b|2026-03-01",
    ]);
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
    s.setItem("tnhc:hike-log", "{not json");
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

  it("stores a photoId when provided and omits it otherwise", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", { photoId: "ph-1" }, s);
    addHike("b", "2026-01-02", undefined, s);
    expect(readLog(s)[0].photoId).toBe("ph-1");
    expect(readLog(s)[1].photoId).toBeUndefined();
  });

  it("garbage-collects local photos when a trail is removed", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", { photoId: "ph-1" }, s);
    addHike("a", "2026-02-01", { photoId: "ph-2" }, s);
    addHike("b", "2026-03-01", { photoId: "keep" }, s);
    vi.mocked(deletePhoto).mockClear();

    removeTrail("a", s);

    expect(deletePhoto).toHaveBeenCalledWith("ph-1");
    expect(deletePhoto).toHaveBeenCalledWith("ph-2");
    expect(deletePhoto).not.toHaveBeenCalledWith("keep");
  });

  it("sets the photo URL on the matching entry only", () => {
    const s = memStorage();
    addHike("a", "2026-01-01", { photoId: "ph-1" }, s);
    addHike("a", "2026-02-01", { photoId: "ph-2" }, s);

    setEntryPhotoUrl("a", "2026-02-01", "https://blob/p.jpg", s);

    const log = readLog(s);
    expect(log.find((e) => e.hikedOn === "2026-02-01")?.photoUrl).toBe(
      "https://blob/p.jpg",
    );
    expect(log.find((e) => e.hikedOn === "2026-01-01")?.photoUrl).toBeUndefined();
  });
});

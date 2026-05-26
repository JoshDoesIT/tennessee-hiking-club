import { describe, it, expect } from "vitest";
import {
  exportLogJson,
  parseLogJson,
  importLogJson,
  exportLogGpx,
} from "./transfer";
import { addHike, readLog } from "./local-log";
import type { HikeLogEntry } from "./types";
import type { Trail } from "@/lib/trails/schema";

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

const log: HikeLogEntry[] = [
  { trailSlug: "a", hikedOn: "2026-01-01" },
  { trailSlug: "b", hikedOn: "2026-02-01" },
];

const make = (slug: string, over: Partial<Trail> = {}): Trail => ({
  slug,
  name: slug.toUpperCase(),
  region: "East",
  area: "A",
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 5,
  elevationGainFt: 1000,
  difficulty: "moderate",
  routeType: "loop",
  tags: [],
  photos: [],
  summary: "s",
  body: "",
  ...over,
});

describe("exportLogJson / parseLogJson", () => {
  it("round-trips a log through JSON", () => {
    expect(parseLogJson(exportLogJson(log))).toEqual(log);
  });

  it("accepts a bare array of entries", () => {
    expect(parseLogJson(JSON.stringify(log))).toEqual(log);
  });

  it("carries note and conditions through JSON", () => {
    const detailed: HikeLogEntry[] = [
      {
        trailSlug: "a",
        hikedOn: "2026-01-01",
        note: "muddy but worth it",
        conditions: "Muddy",
      },
    ];
    expect(parseLogJson(exportLogJson(detailed))).toEqual(detailed);
  });

  it("throws on malformed JSON", () => {
    expect(() => parseLogJson("{not json")).toThrow();
  });

  it("rejects entries missing required fields", () => {
    expect(() =>
      parseLogJson(JSON.stringify([{ trailSlug: "a" }])),
    ).toThrow();
  });
});

describe("importLogJson", () => {
  it("replaces the stored log", () => {
    const s = memStorage();
    addHike("old", "2025-12-31", undefined, s);
    const next = importLogJson(exportLogJson(log), "replace", s);
    expect(next).toEqual(log);
    expect(readLog(s)).toEqual(log);
  });

  it("merges without duplicating identical entries", () => {
    const s = memStorage();
    importLogJson(exportLogJson(log), "replace", s);
    const merged = importLogJson(
      JSON.stringify([
        { trailSlug: "b", hikedOn: "2026-02-01" },
        { trailSlug: "c", hikedOn: "2026-03-01" },
      ]),
      "merge",
      s,
    );
    expect(merged.map((e) => e.trailSlug).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("exportLogGpx", () => {
  const trails = [make("a", { name: "Trail A" }), make("b", { name: "Trail B" })];

  it("emits a GPX waypoint per distinct hiked trail", () => {
    const gpx = exportLogGpx(log, trails);
    expect(gpx).toContain("<gpx");
    expect(gpx).toContain('lat="35.6"');
    expect(gpx).toContain('lon="-83.4"');
    expect(gpx).toContain("<name>Trail A</name>");
    expect((gpx.match(/<wpt/g) ?? []).length).toBe(2);
  });

  it("skips logged trails that are not in the catalog", () => {
    const gpx = exportLogGpx(
      [{ trailSlug: "ghost", hikedOn: "2026-01-01" }],
      trails,
    );
    expect((gpx.match(/<wpt/g) ?? []).length).toBe(0);
  });
});

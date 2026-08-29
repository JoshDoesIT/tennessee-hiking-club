import { describe, it, expect, beforeEach } from "vitest";
import {
  exportLogJson,
  parseLogJson,
  importLogJson,
  exportLogGpx,
  withPhotoData,
  restorePhotos,
} from "./transfer";
import { addHike, readLog } from "./local-log";
import { putPhoto, getPhoto } from "./photo-store";
import type { HikeLogEntry } from "./types";
import type { Trail } from "@/lib/trails/schema";

function resetPhotos(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase("tnhc");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

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
  alerts: [],
  conditionReports: [],
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
    expect(() => parseLogJson(JSON.stringify([{ trailSlug: "a" }]))).toThrow();
  });
});

describe("importLogJson", () => {
  it("replaces the stored log", async () => {
    const s = memStorage();
    addHike("old", "2025-12-31", undefined, s);
    const next = await importLogJson(exportLogJson(log), "replace", s);
    expect(next).toEqual(log);
    expect(readLog(s)).toEqual(log);
  });

  it("merges without duplicating identical entries", async () => {
    const s = memStorage();
    await importLogJson(exportLogJson(log), "replace", s);
    const merged = await importLogJson(
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

describe("photo round-trip", () => {
  beforeEach(resetPhotos);

  it("embeds a photo as base64 and restores it into IndexedDB", async () => {
    await putPhoto("ph-1", new Blob(["photo-bytes"], { type: "image/jpeg" }));
    const withPhoto: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01", photoId: "ph-1" },
    ];

    const enriched = await withPhotoData(withPhoto);
    expect(enriched[0].photoData).toMatch(/^data:image\/jpeg;base64,/);

    const parsed = parseLogJson(exportLogJson(enriched));
    expect(parsed[0].photoData).toBeTruthy();

    // Simulate landing on a fresh device with an empty photo store.
    await resetPhotos();
    const restored = await restorePhotos(parsed);
    expect(restored[0].photoId).toBe("ph-1");
    expect(restored[0]).not.toHaveProperty("photoData");
    expect(await (await getPhoto("ph-1"))!.text()).toBe("photo-bytes");
  });

  it("leaves entries without a photo untouched", async () => {
    const enriched = await withPhotoData([
      { trailSlug: "a", hikedOn: "2026-01-01" },
    ]);
    expect(enriched[0]).not.toHaveProperty("photoData");
  });

  it("generates a photoId when an imported photo lacks one", async () => {
    const restored = await restorePhotos([
      {
        trailSlug: "a",
        hikedOn: "2026-01-01",
        photoData: "data:image/jpeg;base64,aGk=",
      },
    ]);
    expect(restored[0].photoId).toBeTruthy();
    expect(await (await getPhoto(restored[0].photoId!))!.text()).toBe("hi");
  });
});

describe("exportLogGpx", () => {
  const trails = [
    make("a", { name: "Trail A" }),
    make("b", { name: "Trail B" }),
  ];

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

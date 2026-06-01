import { describe, it, expect } from "vitest";
import { mergeHikes, planSync, rowToEntry, entryToInsert } from "./sync";
import type { HikeLogEntry } from "./types";

describe("mergeHikes", () => {
  it("unions disjoint logs", () => {
    const a: HikeLogEntry[] = [{ trailSlug: "x", hikedOn: "2026-01-01" }];
    const b: HikeLogEntry[] = [{ trailSlug: "y", hikedOn: "2026-02-01" }];
    expect(mergeHikes(a, b)).toEqual([
      { trailSlug: "x", hikedOn: "2026-01-01" },
      { trailSlug: "y", hikedOn: "2026-02-01" },
    ]);
  });

  it("dedupes the same trail and date, filling in details", () => {
    const a: HikeLogEntry[] = [{ trailSlug: "x", hikedOn: "2026-01-01" }];
    const b: HikeLogEntry[] = [
      { trailSlug: "x", hikedOn: "2026-01-01", note: "great", conditions: "Dry" },
    ];
    const merged = mergeHikes(a, b);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      trailSlug: "x",
      hikedOn: "2026-01-01",
      note: "great",
      conditions: "Dry",
    });
  });

  it("keeps the same trail on different dates as separate hikes", () => {
    const a: HikeLogEntry[] = [{ trailSlug: "x", hikedOn: "2026-01-01" }];
    const b: HikeLogEntry[] = [{ trailSlug: "x", hikedOn: "2026-03-01" }];
    expect(mergeHikes(a, b)).toHaveLength(2);
  });

  it("sorts the result by date", () => {
    const a: HikeLogEntry[] = [{ trailSlug: "x", hikedOn: "2026-03-01" }];
    const b: HikeLogEntry[] = [{ trailSlug: "y", hikedOn: "2026-01-01" }];
    expect(mergeHikes(a, b).map((e) => e.hikedOn)).toEqual([
      "2026-01-01",
      "2026-03-01",
    ]);
  });
});

describe("planSync", () => {
  it("inserts local entries the account does not have, and merges the rest", () => {
    const local: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01" },
      { trailSlug: "b", hikedOn: "2026-02-01", note: "muddy" },
    ];
    const remote: HikeLogEntry[] = [{ trailSlug: "b", hikedOn: "2026-02-01" }];

    const { toInsert, merged } = planSync(local, remote);
    expect(toInsert).toEqual([{ trailSlug: "a", hikedOn: "2026-01-01" }]);
    expect(merged.map((e) => e.trailSlug)).toEqual(["a", "b"]);
  });

  it("inserts nothing when the account already has every local hike", () => {
    const local: HikeLogEntry[] = [{ trailSlug: "a", hikedOn: "2026-01-01" }];
    const remote: HikeLogEntry[] = [{ trailSlug: "a", hikedOn: "2026-01-01" }];
    expect(planSync(local, remote).toInsert).toEqual([]);
  });

  it("backfills a photoUrl for a remote hike that is missing one", () => {
    const local: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01", photoUrl: "https://b/p.jpg" },
    ];
    const remote: HikeLogEntry[] = [{ trailSlug: "a", hikedOn: "2026-01-01" }];
    expect(planSync(local, remote).toUpdate).toEqual([
      { trailSlug: "a", hikedOn: "2026-01-01", photoUrl: "https://b/p.jpg" },
    ]);
  });

  it("does not backfill when the remote already has a photoUrl", () => {
    const local: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01", photoUrl: "https://b/new.jpg" },
    ];
    const remote: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01", photoUrl: "https://b/old.jpg" },
    ];
    expect(planSync(local, remote).toUpdate).toEqual([]);
  });

  it("does not backfill a hike the account does not have yet", () => {
    const local: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01", photoUrl: "https://b/p.jpg" },
    ];
    expect(planSync(local, []).toUpdate).toEqual([]);
  });
});

describe("mergeHikes photo fields", () => {
  it("fills a missing photoUrl without overwriting an existing one", () => {
    const filled = mergeHikes(
      [{ trailSlug: "x", hikedOn: "2026-01-01" }],
      [{ trailSlug: "x", hikedOn: "2026-01-01", photoUrl: "https://b/p.jpg" }],
    );
    expect(filled[0].photoUrl).toBe("https://b/p.jpg");

    const kept = mergeHikes(
      [{ trailSlug: "x", hikedOn: "2026-01-01", photoUrl: "https://b/keep.jpg" }],
      [{ trailSlug: "x", hikedOn: "2026-01-01", photoUrl: "https://b/other.jpg" }],
    );
    expect(kept[0].photoUrl).toBe("https://b/keep.jpg");
  });

  it("carries a local photoId through the merge", () => {
    const merged = mergeHikes(
      [{ trailSlug: "x", hikedOn: "2026-01-01", photoId: "ph-1" }],
      [{ trailSlug: "x", hikedOn: "2026-01-01", photoUrl: "https://b/p.jpg" }],
    );
    expect(merged[0]).toMatchObject({ photoId: "ph-1", photoUrl: "https://b/p.jpg" });
  });
});

describe("row mappers", () => {
  it("rowToEntry drops null note, conditions, and photoUrl", () => {
    expect(
      rowToEntry({
        trailSlug: "a",
        hikedOn: "2026-01-01",
        note: null,
        conditions: null,
        photoUrl: null,
      }),
    ).toEqual({ trailSlug: "a", hikedOn: "2026-01-01" });
  });

  it("rowToEntry keeps a note, conditions, and photoUrl when present", () => {
    expect(
      rowToEntry({
        trailSlug: "a",
        hikedOn: "2026-01-01",
        note: "great",
        conditions: "Dry",
        photoUrl: "https://b/p.jpg",
      }),
    ).toMatchObject({
      note: "great",
      conditions: "Dry",
      photoUrl: "https://b/p.jpg",
    });
  });

  it("entryToInsert sets the user id and nulls absent fields", () => {
    expect(entryToInsert("u1", { trailSlug: "a", hikedOn: "2026-01-01" })).toEqual(
      {
        userId: "u1",
        trailSlug: "a",
        hikedOn: "2026-01-01",
        note: null,
        conditions: null,
        photoUrl: null,
        route: null,
        trackDurationMin: null,
      },
    );
  });

  it("entryToInsert carries a photoUrl when present", () => {
    expect(
      entryToInsert("u1", {
        trailSlug: "a",
        hikedOn: "2026-01-01",
        photoUrl: "https://b/p.jpg",
      }).photoUrl,
    ).toBe("https://b/p.jpg");
  });

  it("entryToInsert serialises a recorded track and its duration", () => {
    const points = [
      { lat: 35.6, lng: -83.45, elevationFt: 1000 },
      { lat: 35.62, lng: -83.44, elevationFt: 1200 },
    ];
    const row = entryToInsert("u1", {
      trailSlug: "a",
      hikedOn: "2026-01-01",
      track: { points, durationMin: 90 },
    });
    expect(JSON.parse(row.route as string)).toEqual(points);
    expect(row.trackDurationMin).toBe(90);
  });

  it("rowToEntry rebuilds a track from the stored route and duration", () => {
    const points = [
      { lat: 35.6, lng: -83.45, elevationFt: 1000 },
      { lat: 35.62, lng: -83.44, elevationFt: 1200 },
    ];
    const entry = rowToEntry({
      trailSlug: "a",
      hikedOn: "2026-01-01",
      note: null,
      conditions: null,
      photoUrl: null,
      route: JSON.stringify(points),
      trackDurationMin: 90,
    });
    expect(entry.track).toEqual({ points, durationMin: 90 });
  });

  it("rowToEntry leaves track unset when the row has no route", () => {
    const entry = rowToEntry({
      trailSlug: "a",
      hikedOn: "2026-01-01",
      note: null,
      conditions: null,
      photoUrl: null,
      route: null,
      trackDurationMin: null,
    });
    expect(entry.track).toBeUndefined();
  });
});

describe("mergeHikes track field", () => {
  const points = [
    { lat: 35.6, lng: -83.45, elevationFt: 1000 },
    { lat: 35.62, lng: -83.44, elevationFt: 1200 },
  ];

  it("fills a missing track from the other side of the merge", () => {
    const merged = mergeHikes(
      [{ trailSlug: "a", hikedOn: "2026-01-01" }],
      [{ trailSlug: "a", hikedOn: "2026-01-01", track: { points } }],
    );
    expect(merged[0].track).toEqual({ points });
  });

  it("keeps an existing track over the other side's", () => {
    const merged = mergeHikes(
      [{ trailSlug: "a", hikedOn: "2026-01-01", track: { points, durationMin: 90 } }],
      [{ trailSlug: "a", hikedOn: "2026-01-01", track: { points: [] } }],
    );
    expect(merged[0].track?.durationMin).toBe(90);
  });
});

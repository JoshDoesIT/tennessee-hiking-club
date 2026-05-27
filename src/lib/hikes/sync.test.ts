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
});

describe("row mappers", () => {
  it("rowToEntry drops null note and conditions", () => {
    expect(
      rowToEntry({
        trailSlug: "a",
        hikedOn: "2026-01-01",
        note: null,
        conditions: null,
      }),
    ).toEqual({ trailSlug: "a", hikedOn: "2026-01-01" });
  });

  it("rowToEntry keeps a note and conditions when present", () => {
    expect(
      rowToEntry({
        trailSlug: "a",
        hikedOn: "2026-01-01",
        note: "great",
        conditions: "Dry",
      }),
    ).toMatchObject({ note: "great", conditions: "Dry" });
  });

  it("entryToInsert sets the user id and nulls absent fields", () => {
    expect(entryToInsert("u1", { trailSlug: "a", hikedOn: "2026-01-01" })).toEqual(
      {
        userId: "u1",
        trailSlug: "a",
        hikedOn: "2026-01-01",
        note: null,
        conditions: null,
      },
    );
  });
});

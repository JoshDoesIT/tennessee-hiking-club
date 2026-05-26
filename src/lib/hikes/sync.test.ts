import { describe, it, expect } from "vitest";
import { mergeHikes } from "./sync";
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

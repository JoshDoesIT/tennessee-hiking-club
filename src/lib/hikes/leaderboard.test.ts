import { describe, it, expect } from "vitest";
import {
  rankLeaderboard,
  leaderboardEntry,
  filterHikesByWindow,
  filterCleanupsByWindow,
  type LeaderboardEntry,
} from "./leaderboard";
import type { Trail } from "@/lib/trails/schema";

const entries: LeaderboardEntry[] = [
  { user: "ann", regions: 3, trails: 9, challenges: 2, contributions: 0 },
  { user: "bob", regions: 3, trails: 5, challenges: 4, contributions: 1 },
  { user: "cy", regions: 2, trails: 5, challenges: 1, contributions: 5 },
];

const make = (slug: string, region: Trail["region"]): Trail => ({
  slug,
  name: slug,
  region,
  area: slug,
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 5,
  elevationGainFt: 500,
  difficulty: "moderate",
  routeType: "loop",
  tags: [],
  photos: [],
  summary: "s",
  body: "",
});

describe("rankLeaderboard", () => {
  it("ranks by the chosen breadth metric, descending, ties sharing a rank", () => {
    const r = rankLeaderboard(entries, "trails");
    expect(r.map((e) => e.user)).toEqual(["ann", "bob", "cy"]);
    expect(r.map((e) => e.rank)).toEqual([1, 2, 2]);
  });

  it("ranks by stewardship (contributions)", () => {
    expect(rankLeaderboard(entries, "contributions")[0].user).toBe("cy");
  });

  it("does not mutate the input", () => {
    const snapshot = JSON.stringify(entries);
    rankLeaderboard(entries, "challenges");
    expect(JSON.stringify(entries)).toBe(snapshot);
  });
});

describe("leaderboardEntry", () => {
  const trails = [make("a", "East"), make("b", "Middle"), make("c", "West")];

  it("summarises a hiker's breadth and completed challenges", () => {
    const hikes = [
      { trailSlug: "a", hikedOn: "2026-01-01" },
      { trailSlug: "b", hikedOn: "2026-02-01" },
      { trailSlug: "c", hikedOn: "2026-03-01" },
    ];
    const entry = leaderboardEntry("ann", hikes, trails);
    expect(entry).toMatchObject({
      user: "ann",
      regions: 3,
      trails: 3,
      contributions: 0,
    });
    // Hiking all three Grand Divisions completes "Cross the State".
    expect(entry.challenges).toBeGreaterThanOrEqual(1);
  });

  it("counts only distinct trails and ignores unknown slugs", () => {
    const hikes = [
      { trailSlug: "a", hikedOn: "2026-01-01" },
      { trailSlug: "a", hikedOn: "2026-02-01" },
      { trailSlug: "ghost", hikedOn: "2026-03-01" },
    ];
    const entry = leaderboardEntry("bob", hikes, trails);
    expect(entry.trails).toBe(1);
    expect(entry.regions).toBe(1);
  });

  it("records the contributions count it is given (synced cleanup days)", () => {
    expect(leaderboardEntry("ann", [], trails, 4).contributions).toBe(4);
  });

  it("defaults contributions to 0 when none are given", () => {
    expect(leaderboardEntry("ann", [], trails).contributions).toBe(0);
  });
});

describe("filterHikesByWindow", () => {
  const hikes = [
    { trailSlug: "a", hikedOn: "2026-03-01" },
    { trailSlug: "b", hikedOn: "2025-08-01" },
    { trailSlug: "c", hikedOn: "2026-01-15" },
  ];
  const now = new Date("2026-05-27T12:00:00Z");

  it("returns every hike for the all-time window", () => {
    expect(filterHikesByWindow(hikes, "all", now)).toHaveLength(3);
  });

  it("keeps only the current year's hikes for the year window", () => {
    expect(
      filterHikesByWindow(hikes, "year", now).map((h) => h.trailSlug),
    ).toEqual(["a", "c"]);
  });
});

describe("filterCleanupsByWindow", () => {
  const cleanups = [
    { loggedOn: "2026-03-01" },
    { loggedOn: "2025-08-01" },
    { loggedOn: "2026-01-15" },
  ];
  const now = new Date("2026-05-27T12:00:00Z");

  it("returns every cleanup for the all-time window", () => {
    expect(filterCleanupsByWindow(cleanups, "all", now)).toHaveLength(3);
  });

  it("keeps only the current year's cleanups for the year window", () => {
    expect(
      filterCleanupsByWindow(cleanups, "year", now).map((c) => c.loggedOn),
    ).toEqual(["2026-03-01", "2026-01-15"]);
  });
});

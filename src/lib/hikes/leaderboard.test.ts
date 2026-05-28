import { describe, it, expect } from "vitest";
import {
  rankLeaderboard,
  leaderboardEntry,
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
});

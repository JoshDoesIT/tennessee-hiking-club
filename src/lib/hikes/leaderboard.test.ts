import { describe, it, expect } from "vitest";
import { rankLeaderboard, type LeaderboardEntry } from "./leaderboard";

const entries: LeaderboardEntry[] = [
  { user: "ann", regions: 3, trails: 9, challenges: 2, contributions: 0 },
  { user: "bob", regions: 3, trails: 5, challenges: 4, contributions: 1 },
  { user: "cy", regions: 2, trails: 5, challenges: 1, contributions: 5 },
];

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

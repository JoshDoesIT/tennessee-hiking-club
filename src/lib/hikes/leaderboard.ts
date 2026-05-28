import type { Trail } from "@/lib/trails/schema";
import type { HikeLogEntry } from "./types";
import { computeStats } from "./stats";
import { CHALLENGES, evaluateChallenge } from "./challenges";

export type LeaderboardEntry = {
  user: string;
  regions: number;
  trails: number;
  challenges: number;
  contributions: number;
};

/** Breadth- and stewardship-oriented metrics only (never distance or speed). */
export type LeaderboardMetric =
  | "regions"
  | "trails"
  | "challenges"
  | "contributions";

export type RankedEntry = LeaderboardEntry & { rank: number };

/** Build a leaderboard entry from a hiker's log: breadth (Grand Divisions and
 *  distinct trails) and challenges completed. Contributions are not tracked
 *  yet, so they are 0 for now. */
export function leaderboardEntry(
  user: string,
  hikes: HikeLogEntry[],
  trails: Trail[],
): LeaderboardEntry {
  const stats = computeStats(hikes, trails);
  const completed = hikes.map((h) => h.trailSlug);
  const challenges = CHALLENGES.filter(
    (c) => evaluateChallenge(c, completed, trails).done,
  ).length;

  return {
    user,
    regions: stats.regions.length,
    trails: stats.trails,
    challenges,
    contributions: 0,
  };
}

/** Rank entries by a metric, highest first. Ties share a rank; the input is
 *  not mutated. Names break ties so the order is stable. */
export function rankLeaderboard(
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric,
): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b[metric] - a[metric] || a.user.localeCompare(b.user),
  );

  let rank = 0;
  let prev: number | null = null;
  return sorted.map((entry, index) => {
    if (prev === null || entry[metric] !== prev) {
      rank = index + 1;
      prev = entry[metric];
    }
    return { ...entry, rank };
  });
}

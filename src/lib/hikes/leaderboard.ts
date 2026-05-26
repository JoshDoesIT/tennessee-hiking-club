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

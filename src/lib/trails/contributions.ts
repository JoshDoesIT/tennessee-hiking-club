import type { Trail } from "./schema";

/**
 * Community contributions attributed by GitHub login, derived from trail
 * content (curated via PR). Pure and case-insensitive, mirroring how challenges
 * are computed rather than stored.
 */
export type ContributionCounts = {
  trailsContributed: number;
  conditionsReported: number;
  photoCredits: number;
  total: number;
};

function blank(): ContributionCounts {
  return {
    trailsContributed: 0,
    conditionsReported: 0,
    photoCredits: 0,
    total: 0,
  };
}

export function aggregateContributions(
  trails: Trail[],
): Map<string, ContributionCounts> {
  const map = new Map<string, ContributionCounts>();
  const bump = (login: string, key: keyof ContributionCounts) => {
    const k = login.trim().toLowerCase();
    if (!k) return;
    const counts = map.get(k) ?? blank();
    counts[key] += 1;
    counts.total += 1;
    map.set(k, counts);
  };

  for (const trail of trails) {
    // Dedupe contributors within a single trail.
    for (const login of new Set(trail.contributors ?? [])) {
      bump(login, "trailsContributed");
    }
    for (const report of trail.conditionReports) {
      if (report.by) bump(report.by, "conditionsReported");
    }
    for (const photo of trail.photos) {
      if (photo.by) bump(photo.by, "photoCredits");
    }
  }

  return map;
}

/** Total contributions for a login (case-insensitive), or 0. */
export function contributionCountFor(
  map: Map<string, ContributionCounts>,
  login: string,
): number {
  return map.get(login.trim().toLowerCase())?.total ?? 0;
}

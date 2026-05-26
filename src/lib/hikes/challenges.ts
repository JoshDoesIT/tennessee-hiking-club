import { REGIONS, type Trail } from "@/lib/trails/schema";

/** How a challenge is satisfied, evaluated from a hiker's completed trails. */
export type Criterion =
  | { kind: "allRegions" }
  | { kind: "trails"; slugs: string[] }
  | { kind: "tagCount"; tag: string; count: number }
  | { kind: "count"; count: number };

export type Challenge = {
  slug: string;
  name: string;
  description: string;
  criterion: Criterion;
  season?: string;
};

export type ChallengeProgress = {
  done: boolean;
  progress: number;
  total: number;
};

/** Progress toward a challenge given the trails a hiker has completed. */
export function evaluateChallenge(
  challenge: Challenge,
  completedSlugs: string[],
  trails: Trail[],
): ChallengeProgress {
  const bySlug = new Map(trails.map((t) => [t.slug, t]));
  const distinct = [...new Set(completedSlugs.filter((s) => bySlug.has(s)))];
  const completedTrails = distinct.map((s) => bySlug.get(s)!);
  const c = challenge.criterion;

  switch (c.kind) {
    case "allRegions": {
      const total = REGIONS.length;
      const progress = REGIONS.filter((r) =>
        completedTrails.some((t) => t.region === r),
      ).length;
      return { done: progress >= total, progress, total };
    }
    case "trails": {
      const have = new Set(distinct);
      const progress = c.slugs.filter((s) => have.has(s)).length;
      return {
        done: progress >= c.slugs.length,
        progress,
        total: c.slugs.length,
      };
    }
    case "tagCount": {
      const matching = completedTrails.filter((t) =>
        t.tags.includes(c.tag),
      ).length;
      const progress = Math.min(matching, c.count);
      return { done: progress >= c.count, progress, total: c.count };
    }
    case "count": {
      const progress = Math.min(distinct.length, c.count);
      return { done: progress >= c.count, progress, total: c.count };
    }
  }
}

/** Seed Tennessee challenge set (breadth + seasonal/regional identity). */
export const CHALLENGES: Challenge[] = [
  {
    slug: "cross-the-state",
    name: "Cross the State",
    description:
      "Hike in all three Grand Divisions: East, Middle, and West Tennessee.",
    criterion: { kind: "allRegions" },
  },
  {
    slug: "tennessee-waterfaller",
    name: "Tennessee Waterfaller",
    description: "Chase three of Tennessee's waterfalls.",
    criterion: { kind: "tagCount", tag: "waterfall", count: 3 },
  },
  {
    slug: "five-and-counting",
    name: "Five and Counting",
    description: "Log five different trails to find your stride.",
    criterion: { kind: "count", count: 5 },
  },
  {
    slug: "smoky-summits",
    name: "Smoky Summits",
    description:
      "Reach the high country: Mount LeConte via Alum Cave and Charlies Bunion.",
    criterion: {
      kind: "trails",
      slugs: ["mt-leconte-alum-cave", "charlies-bunion"],
    },
  },
];

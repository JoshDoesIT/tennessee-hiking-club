import { z } from "zod";
import { REGIONS, type Trail } from "@/lib/trails/schema";

/**
 * How a challenge is satisfied, evaluated from a hiker's completed trails.
 * The schema is the source of truth (like the trail catalog); the types below
 * are inferred from it, and the seed set is validated against it at load.
 */
export const criterionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("allRegions") }),
  z.object({
    kind: z.literal("trails"),
    slugs: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal("tagCount"),
    tag: z.string().min(1),
    count: z.number().int().positive(),
  }),
  z.object({ kind: z.literal("count"), count: z.number().int().positive() }),
]);

export const challengeSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  criterion: criterionSchema,
  season: z.string().min(1).optional(),
});

export type Criterion = z.infer<typeof criterionSchema>;
export type Challenge = z.infer<typeof challengeSchema>;

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

/**
 * Seed Tennessee challenge set (breadth + seasonal/regional identity).
 * Every challenge here must be completable with the shipped trail catalog;
 * `challenges.test.ts` enforces that against the real content.
 */
export const CHALLENGES: Challenge[] = challengeSchema.array().parse([
  {
    slug: "cross-the-state",
    name: "Cross the State",
    description:
      "Hike in all three Grand Divisions: East, Middle, and West Tennessee.",
    criterion: { kind: "allRegions" },
  },
  {
    slug: "state-parks-passport",
    name: "State Parks Passport",
    description: "Explore three of Tennessee's state parks.",
    criterion: { kind: "tagCount", tag: "state-park", count: 3 },
  },
  {
    slug: "tennessee-waterfaller",
    name: "Tennessee Waterfaller",
    description: "Chase two of Tennessee's classic waterfalls.",
    criterion: { kind: "tagCount", tag: "waterfall", count: 2 },
  },
  {
    slug: "grassy-balds",
    name: "Grassy Balds",
    description: "Walk the open, grass-topped balds of the high country.",
    criterion: { kind: "tagCount", tag: "balds", count: 1 },
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
  {
    slug: "five-and-counting",
    name: "Five and Counting",
    description: "Log five different trails to find your stride.",
    criterion: { kind: "count", count: 5 },
  },
  {
    slug: "roan-rhododendron",
    name: "Roan Rhododendron",
    description:
      "Catch the Roan Highlands rhododendron gardens in their June bloom.",
    criterion: { kind: "trails", slugs: ["roan-highlands-balds"] },
    season: "Late June",
  },
  {
    slug: "reelfoot-eagles",
    name: "Reelfoot Eagles",
    description: "Visit Reelfoot Lake while the bald eagles winter over.",
    criterion: { kind: "trails", slugs: ["reelfoot-black-bayou"] },
    season: "Winter",
  },
  {
    slug: "fall-color-tour",
    name: "Fall Color Tour",
    description: "Stand on three big overlooks as the hardwoods turn.",
    criterion: { kind: "tagCount", tag: "views", count: 3 },
    season: "October",
  },
]);

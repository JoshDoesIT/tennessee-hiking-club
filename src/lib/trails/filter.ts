import { REGIONS, DIFFICULTIES } from "./schema";
import type { Trail, Region, Difficulty } from "./schema";

/** Length filter buckets (miles), with display labels and predicates. */
export const LENGTH_BUCKETS = {
  short: { label: "Under 5 mi", match: (mi: number) => mi < 5 },
  medium: { label: "5 to 10 mi", match: (mi: number) => mi >= 5 && mi <= 10 },
  long: { label: "Over 10 mi", match: (mi: number) => mi > 10 },
} as const;

export type LengthBucket = keyof typeof LENGTH_BUCKETS;

export type TrailFilters = {
  region?: Region;
  difficulty?: Difficulty;
  length?: LengthBucket;
};

/** Trails matching every provided filter (an absent filter is unconstrained). */
export function filterTrails(trails: Trail[], filters: TrailFilters): Trail[] {
  return trails.filter((trail) => {
    if (filters.region && trail.region !== filters.region) return false;
    if (filters.difficulty && trail.difficulty !== filters.difficulty) {
      return false;
    }
    if (
      filters.length &&
      !LENGTH_BUCKETS[filters.length].match(trail.lengthMiles)
    ) {
      return false;
    }
    return true;
  });
}

type RawParam = string | string[] | undefined;

/** Validate raw URL search params into typed filters, dropping bad values. */
export function parseTrailFilters(
  params: Record<string, RawParam>,
): TrailFilters {
  const first = (v: RawParam) => (Array.isArray(v) ? v[0] : v);
  const region = first(params.region);
  const difficulty = first(params.difficulty);
  const length = first(params.length);

  const filters: TrailFilters = {};
  if (region && (REGIONS as readonly string[]).includes(region)) {
    filters.region = region as Region;
  }
  if (difficulty && (DIFFICULTIES as readonly string[]).includes(difficulty)) {
    filters.difficulty = difficulty as Difficulty;
  }
  if (length && length in LENGTH_BUCKETS) {
    filters.length = length as LengthBucket;
  }
  return filters;
}

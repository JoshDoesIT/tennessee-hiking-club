import { REGIONS, type Region, type Trail } from "@/lib/trails/schema";
import type { HikeLogEntry } from "./types";

export type HikerStats = {
  hikes: number;
  trails: number;
  miles: number;
  elevationFt: number;
  regions: Region[];
  areas: number;
};

/** Personal totals from a hike log. Distance/elevation count repeats; trails,
 *  regions, and areas are distinct. Entries for unknown trails are ignored. */
export function computeStats(log: HikeLogEntry[], trails: Trail[]): HikerStats {
  const bySlug = new Map(trails.map((t) => [t.slug, t]));
  const valid = log.filter((e) => bySlug.has(e.trailSlug));
  const distinct = [...new Set(valid.map((e) => e.trailSlug))];
  const distinctTrails = distinct.map((s) => bySlug.get(s)!);

  const miles = valid.reduce(
    (sum, e) => sum + bySlug.get(e.trailSlug)!.lengthMiles,
    0,
  );
  const elevationFt = valid.reduce(
    (sum, e) => sum + bySlug.get(e.trailSlug)!.elevationGainFt,
    0,
  );

  return {
    hikes: valid.length,
    trails: distinct.length,
    miles: Math.round(miles * 10) / 10,
    elevationFt,
    regions: REGIONS.filter((r) => distinctTrails.some((t) => t.region === r)),
    areas: new Set(distinctTrails.map((t) => t.area)).size,
  };
}

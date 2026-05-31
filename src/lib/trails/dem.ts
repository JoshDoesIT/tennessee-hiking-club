import { metersToFeet } from "./route-import";

/**
 * Sample elevation from the public-domain terrain DEM (#137). Uses USGS 3DEP via
 * OpenTopoData's `ned10m` dataset, the same public data already behind the
 * detail map's hillshade. No API key. This lets a `route` be authored as bare
 * lat/lng points and have elevation filled in (see `scripts/enrich-elevation.ts`),
 * and it backs the route importer's elevation sampling.
 */

const NED10M = "https://api.opentopodata.org/v1/ned10m";
const BATCH = 100; // OpenTopoData allows up to 100 locations per request
const RATE_LIMIT_MS = 1000; // and one request per second

/** Minimal shape of `fetch` this needs, so callers can inject a stub in tests. */
type DemFetch = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ json: () => Promise<unknown> }>;

type DemResponse = {
  status?: string;
  results?: Array<{ elevation: number | null }>;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Elevation in feet for each point, in order. Any point the DEM cannot resolve
 * (no coverage, an API error, or a network failure) comes back as `null` rather
 * than throwing, so a caller can fall back gracefully.
 */
export async function sampleElevationFeet(
  points: Array<{ lat: number; lng: number }>,
  fetchFn: DemFetch = fetch as unknown as DemFetch,
): Promise<Array<number | null>> {
  const out: Array<number | null> = [];
  for (let i = 0; i < points.length; i += BATCH) {
    const batch = points.slice(i, i + BATCH);
    const locations = batch.map((p) => `${p.lat},${p.lng}`).join("|");
    try {
      const res = await fetchFn(NED10M, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations, interpolation: "bilinear" }),
      });
      const json = (await res.json()) as DemResponse;
      if (json.status !== "OK" || !json.results) {
        for (let k = 0; k < batch.length; k++) out.push(null);
      } else {
        for (let k = 0; k < batch.length; k++) {
          const m = json.results[k]?.elevation;
          out.push(m == null ? null : metersToFeet(m));
        }
      }
    } catch {
      for (let k = 0; k < batch.length; k++) out.push(null);
    }
    if (i + BATCH < points.length) await wait(RATE_LIMIT_MS);
  }
  return out;
}

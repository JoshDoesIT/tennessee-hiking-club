import { parseGpxTrack, downsampleRoute } from "@/lib/trails/route-import";
import { buildElevationProfile, type RoutePoint } from "@/lib/trails/elevation";
import { isWithinTennessee } from "@/lib/maps";

/**
 * Turn an uploaded GPX track into a candidate trail `route` (#201). A signed-in
 * member records a hike and contributes the track; this parses it, downsamples
 * to keep the file small, and computes length and gain so the submission can be
 * reviewed and curated into the trail's `route` front-matter. Pure, so it backs
 * both the API route and any preview. The trail's existence is checked in the
 * route (against the content), not here.
 */

const MAX_POINTS = 70;

export type RouteSubmissionResult =
  | {
      ok: true;
      route: RoutePoint[];
      name: string | null;
      pointCount: number;
      lengthMiles: number;
      gainFt: number;
    }
  | { ok: false; error: string };

export function prepareRouteSubmission(
  gpxText: string,
  maxPoints = MAX_POINTS,
): RouteSubmissionResult {
  let parsed: { name: string | null; points: RoutePoint[] };
  try {
    parsed = parseGpxTrack(gpxText);
  } catch {
    return { ok: false, error: "Could not read the GPX file." };
  }
  if (parsed.points.length < 2) {
    return { ok: false, error: "No track with elevation found in the GPX." };
  }
  // The recorded hike must start in Tennessee (it is a Tennessee trail).
  if (!isWithinTennessee(parsed.points[0])) {
    return { ok: false, error: "The track does not start in Tennessee." };
  }
  const route = downsampleRoute(parsed.points, maxPoints);
  const profile = buildElevationProfile(route);
  return {
    ok: true,
    route,
    name: parsed.name,
    pointCount: parsed.points.length,
    lengthMiles: profile.totalMiles,
    gainFt: profile.gainFt,
  };
}

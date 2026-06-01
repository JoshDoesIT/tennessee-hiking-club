import {
  parseGpxTrack,
  downsampleRoute,
  metersToFeet,
} from "@/lib/trails/route-import";
import { buildElevationProfile, type RoutePoint } from "@/lib/trails/elevation";

/**
 * Summarise the GPX from a recorded hike (#201) into a track to store on a log
 * entry: the downsampled points (with elevation) plus length, gain, and the
 * elapsed time when the file carries trackpoint timestamps. Pure and
 * client-safe, so the "mark as hiked" form can parse the upload on the device.
 * Returns null when the GPX has no usable track (fewer than two points).
 */
export type GpxTrackSummary = {
  points: RoutePoint[];
  lengthMiles: number;
  gainFt: number;
  /** Elapsed time from the first to last trackpoint time, in whole minutes. */
  durationMin?: number;
};

const TRKPT_RE = /<trkpt\b[^>]*>([\s\S]*?)<\/trkpt>/g;
const TIME_RE = /<time>\s*([^<]+?)\s*<\/time>/;

/** First-to-last elapsed minutes across trackpoint <time> tags, if present.
 *  Scoped to <trkpt> blocks so a <metadata><time> (file creation) is ignored. */
function trackDurationMin(xml: string): number | undefined {
  const times: number[] = [];
  let m: RegExpExecArray | null;
  TRKPT_RE.lastIndex = 0;
  while ((m = TRKPT_RE.exec(xml))) {
    const t = m[1].match(TIME_RE);
    if (!t) continue;
    const ms = Date.parse(t[1]);
    if (Number.isFinite(ms)) times.push(ms);
  }
  if (times.length < 2) return undefined;
  const minutes = Math.round((times[times.length - 1] - times[0]) / 60000);
  return minutes > 0 ? minutes : undefined;
}

/** Map a Geolocation reading to a route point for live recording (#201).
 *  Altitude is often missing in the browser, so it falls back to zero feet. */
export function positionToPoint(coords: {
  latitude: number;
  longitude: number;
  altitude?: number | null;
}): RoutePoint {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    elevationFt:
      coords.altitude != null ? Math.round(metersToFeet(coords.altitude)) : 0,
  };
}

export function gpxTrackSummary(
  gpxText: string,
  maxPoints = 70,
): GpxTrackSummary | null {
  let points: RoutePoint[];
  try {
    points = parseGpxTrack(gpxText).points;
  } catch {
    return null;
  }
  if (points.length < 2) return null;

  const durationMin = trackDurationMin(gpxText);
  const route = downsampleRoute(points, maxPoints);
  const profile = buildElevationProfile(route);
  return {
    points: route,
    lengthMiles: profile.totalMiles,
    gainFt: profile.gainFt,
    ...(durationMin !== undefined ? { durationMin } : {}),
  };
}

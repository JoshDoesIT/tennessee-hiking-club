import { haversineMiles } from "@/lib/trails/elevation";

type LngLatish = { lat: number; lng: number };

/**
 * The live map center and "you are here" marker position while recording a hike
 * (#271): the most recent GPS fix, or the trailhead fallback before the first
 * fix has arrived. Returned as a MapLibre `[lng, lat]` pair.
 */
export function currentPosition(
  points: LngLatish[],
  fallback: LngLatish,
): [number, number] {
  const last = points[points.length - 1] ?? fallback;
  return [last.lng, last.lat];
}

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Initial compass bearing from `a` to `b` in degrees clockwise from north
 *  (0 = north, 90 = east). Used to orient the course-up map and heading puck. */
export function bearingBetween(a: LngLatish, b: LngLatish): number {
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** South-west and north-east corners (`[[w, s], [e, n]]`) enclosing the given
 *  coordinates, for framing the whole route plus position in overview mode.
 *  Null when there is nothing to frame. */
export function boundsOf(
  coords: LngLatish[],
): [[number, number], [number, number]] | null {
  if (coords.length === 0) return null;
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const c of coords) {
    if (c.lng < w) w = c.lng;
    if (c.lng > e) e = c.lng;
    if (c.lat < s) s = c.lat;
    if (c.lat > n) n = c.lat;
  }
  return [
    [w, s],
    [e, n],
  ];
}

// ~5 m: below this the move is GPS jitter, not real travel, so we keep the
// previous heading instead of spinning the map.
const MIN_MOVE_MILES = 0.003;

/** The current direction of travel in degrees, from the most recent fix back to
 *  the last fix that is a real step away (skipping jitter). Null when there is
 *  not enough movement yet, so the caller can leave the map north-up. */
export function travelHeading(
  points: LngLatish[],
  minMiles = MIN_MOVE_MILES,
): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  for (let i = points.length - 2; i >= 0; i--) {
    if (haversineMiles(points[i], last) >= minMiles) {
      return bearingBetween(points[i], last);
    }
  }
  return null;
}

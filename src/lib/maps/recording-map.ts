/**
 * The live map center and "you are here" marker position while recording a hike
 * (#271): the most recent GPS fix, or the trailhead fallback before the first
 * fix has arrived. Returned as a MapLibre `[lng, lat]` pair.
 */
export function currentPosition(
  points: { lat: number; lng: number }[],
  fallback: { lat: number; lng: number },
): [number, number] {
  const last = points[points.length - 1] ?? fallback;
  return [last.lng, last.lat];
}

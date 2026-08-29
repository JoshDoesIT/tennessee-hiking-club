import { haversineMiles } from "./elevation";

/**
 * Tag each trail with its distance from `from` and sort nearest first. Pure and
 * synchronous; the caller obtains `from` from the browser geolocation API and
 * keeps it on-device.
 */
export function trailsByDistance<
  T extends { coordinates: { lat: number; lng: number } },
>(
  trails: T[],
  from: { lat: number; lng: number },
): (T & { distanceMi: number })[] {
  return trails
    .map((trail) => ({
      ...trail,
      distanceMi: haversineMiles(from, trail.coordinates),
    }))
    .sort((a, b) => a.distanceMi - b.distanceMi);
}

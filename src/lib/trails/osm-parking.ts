import { haversineMiles } from "./elevation";
import type { Trail, TrailParking } from "./schema";

/**
 * OpenStreetMap parking fallback (#141). When a trail declares no `parking`, a
 * build-time script (`pnpm enrich:parking`) queries the Overpass API for nearby
 * `amenity=parking` and caches the nearest lot into `content/osm-parking.json`.
 * The static pages read that cache; nothing here runs at request time. Declared
 * content parking always wins, and OSM-sourced parking is attributed in the UI.
 */
export type OverpassElement = {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type OsmParking = { lat: number; lng: number; name?: string };
export type OsmParkingMap = Record<string, OsmParking>;

/** Overpass QL for parking near a point. `out center;` gives ways a centroid. */
export function overpassParkingQuery(
  coords: { lat: number; lng: number },
  radiusMeters = 1200,
): string {
  return `[out:json][timeout:25];nwr["amenity"="parking"](around:${radiusMeters},${coords.lat},${coords.lng});out center;`;
}

function elementPoint(el: OverpassElement): OsmParking | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const name = el.tags?.name;
  return name ? { lat, lng, name } : { lat, lng };
}

/** The nearest parking element within `maxMiles` of the trailhead, or null. */
export function selectNearestParking(
  elements: OverpassElement[],
  trailhead: { lat: number; lng: number },
  maxMiles = 2,
): OsmParking | null {
  let best: OsmParking | null = null;
  let bestMiles = Infinity;
  for (const el of elements) {
    const point = elementPoint(el);
    if (!point) continue;
    const miles = haversineMiles(trailhead, point);
    if (miles <= maxMiles && miles < bestMiles) {
      best = point;
      bestMiles = miles;
    }
  }
  return best;
}

/**
 * Resolve the parking to show for a trail: declared content parking if present
 * (source "content"), otherwise the cached OSM lot (source "osm"), or null.
 */
export function resolveParking(
  trail: Trail,
  osm: OsmParkingMap,
): { parking: TrailParking; source: "content" | "osm" } | null {
  if (trail.parking) return { parking: trail.parking, source: "content" };
  const lot = osm[trail.slug];
  if (lot) return { parking: { lat: lot.lat, lng: lot.lng }, source: "osm" };
  return null;
}

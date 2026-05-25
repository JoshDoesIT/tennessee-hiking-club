/**
 * Geographic helpers for linking hiking locations to Google Maps.
 *
 * These produce universal cross-platform deep links (the documented
 * `api=1` Google Maps URL scheme) so a tap opens the native Maps app on
 * mobile or maps.google.com on desktop — no API key, no billing.
 */

export interface LatLng {
  /** Latitude in decimal degrees, -90..90. */
  lat: number;
  /** Longitude in decimal degrees, -180..180. */
  lng: number;
}

function assertValid({ lat, lng }: LatLng): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new RangeError(`Invalid latitude: ${lat}`);
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new RangeError(`Invalid longitude: ${lng}`);
  }
}

/**
 * A deep link that opens turn-by-turn directions to the coordinates.
 * This is the "click it and it takes you there" link used on trail pages.
 */
export function googleMapsDirectionsUrl(coords: LatLng): string {
  assertValid(coords);
  const destination = encodeURIComponent(`${coords.lat},${coords.lng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/** A deep link that shows / drops a pin at the coordinates. */
export function googleMapsPlaceUrl(coords: LatLng): string {
  assertValid(coords);
  const query = encodeURIComponent(`${coords.lat},${coords.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Approximate bounding box of Tennessee, in decimal degrees. */
export const TENNESSEE_BOUNDS = {
  latMin: 34.9,
  latMax: 36.7,
  lngMin: -90.4,
  lngMax: -81.6,
} as const;

/** True if the coordinates fall within Tennessee's bounding box. */
export function isWithinTennessee({ lat, lng }: LatLng): boolean {
  return (
    lat >= TENNESSEE_BOUNDS.latMin &&
    lat <= TENNESSEE_BOUNDS.latMax &&
    lng >= TENNESSEE_BOUNDS.lngMin &&
    lng <= TENNESSEE_BOUNDS.lngMax
  );
}

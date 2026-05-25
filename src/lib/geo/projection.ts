import { geoMercator, type GeoProjection } from "d3-geo";
import { TENNESSEE } from "./tennessee";

/** Fixed viewBox the stylized Tennessee map is drawn into. */
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 360;

/**
 * A Mercator projection fitted to Tennessee within the map viewBox. Create it
 * once and pass it to `projectPoint` for each trail pin.
 */
export function tennesseeProjection(
  width: number = MAP_WIDTH,
  height: number = MAP_HEIGHT,
  padding = 12,
): GeoProjection {
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    TENNESSEE,
  );
}

/** Project a `[lng, lat]` coordinate to `[x, y]` within the map viewBox. */
export function projectPoint(
  lng: number,
  lat: number,
  projection: GeoProjection = tennesseeProjection(),
): [number, number] {
  const point = projection([lng, lat]);
  if (!point) {
    throw new Error(`Cannot project coordinate (${lng}, ${lat}).`);
  }
  return point;
}

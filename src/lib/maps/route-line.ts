/**
 * A trail's stored `route` as a GeoJSON LineString, for drawing the actual trail
 * shape on the MapLibre maps (#270). Returns null when there is not enough of a
 * route to draw a line, so callers can skip the source/layer entirely.
 */
export type RouteLineFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

export function routeLineFeature(
  route?: { lat: number; lng: number }[],
): RouteLineFeature | null {
  if (!route || route.length < 2) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: route.map((p) => [p.lng, p.lat]),
    },
  };
}

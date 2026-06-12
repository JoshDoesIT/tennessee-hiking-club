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

export type RouteLinesCollection = {
  type: "FeatureCollection";
  features: RouteLineFeature[];
};

/** Every trail's route as one GeoJSON FeatureCollection (each carrying its
 *  `slug`), for drawing all the trail shapes on the state/Explore map (#270).
 *  Trails without a drawable route are skipped. */
export function routeLinesCollection(
  trails: { slug?: string; route?: { lat: number; lng: number }[] }[],
): RouteLinesCollection {
  const features: RouteLineFeature[] = [];
  for (const trail of trails) {
    const feature = routeLineFeature(trail.route);
    if (feature) features.push({ ...feature, properties: { slug: trail.slug ?? "" } });
  }
  return { type: "FeatureCollection", features };
}

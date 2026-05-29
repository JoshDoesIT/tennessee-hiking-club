/**
 * Elevation profile and GPX helpers. A trail may carry a `route` (ordered
 * points with elevation) in its content; from that we build a distance/
 * elevation profile and a downloadable GPX track.
 */
export type RoutePoint = { lat: number; lng: number; elevationFt: number };

const EARTH_RADIUS_MI = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in miles. */
export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}

export function buildElevationProfile(route: RoutePoint[]): {
  points: { distanceMi: number; elevationFt: number }[];
  totalMiles: number;
  gainFt: number;
  highFt: number;
  lowFt: number;
} {
  let cumulative = 0;
  let gainFt = 0;
  const points = route.map((point, i) => {
    if (i > 0) {
      cumulative += haversineMiles(route[i - 1], point);
      const delta = point.elevationFt - route[i - 1].elevationFt;
      if (delta > 0) gainFt += delta;
    }
    return { distanceMi: cumulative, elevationFt: point.elevationFt };
  });

  const elevations = route.map((p) => p.elevationFt);
  return {
    points,
    totalMiles: cumulative,
    gainFt,
    highFt: elevations.length ? Math.max(...elevations) : 0,
    lowFt: elevations.length ? Math.min(...elevations) : 0,
  };
}

function escapeXml(value: string): string {
  return value.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c]!,
  );
}

/** A GPX 1.1 track for the route, with elevation on each point. */
export function routeToGpx(name: string, route: RoutePoint[]): string {
  const points = route
    .map(
      (p) =>
        `      <trkpt lat="${p.lat}" lon="${p.lng}">\n        <ele>${p.elevationFt}</ele>\n      </trkpt>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Tennessee Hiking Club" xmlns="http://www.topografix.com/GPX/1/1">\n  <trk>\n    <name>${escapeXml(name)}</name>\n    <trkseg>\n${points}\n    </trkseg>\n  </trk>\n</gpx>\n`;
}

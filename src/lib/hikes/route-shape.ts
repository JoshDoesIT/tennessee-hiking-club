/**
 * Project a recorded GPS track to an SVG `points` string for a small plan-view
 * of the route's shape (#262), to sit beside the elevation sparkline in the
 * recorded-track summary.
 *
 * It is an equirectangular projection with longitude scaled by cos(latitude) so
 * the shape is not stretched horizontally at Tennessee latitudes, fit uniformly
 * into the box so the aspect ratio is preserved, and centred. Latitude is
 * inverted because SVG's y axis grows downward while north is up.
 */
const MIN_SPAN_DEG = 1e-5; // ~1 m; below this the track has not really moved

export function routeShapePath(
  points: { lat: number; lng: number }[],
  width: number,
  height: number,
  pad = 2,
): string {
  if (points.length < 2) return "";

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  if (maxLat - minLat < MIN_SPAN_DEG && maxLng - minLng < MIN_SPAN_DEG) {
    return "";
  }

  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = (maxLng - minLng) * k || Number.EPSILON;
  const spanY = maxLat - minLat || Number.EPSILON;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const offX = pad + (innerW - spanX * scale) / 2;
  const offY = pad + (innerH - spanY * scale) / 2;

  return points
    .map((p) => {
      const x = offX + (p.lng - minLng) * k * scale;
      // Invert latitude: higher lat (north) maps to a smaller y (higher up).
      const y = offY + (maxLat - p.lat) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

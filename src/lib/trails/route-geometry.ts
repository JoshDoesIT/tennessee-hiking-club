/**
 * Pure helpers for assembling a trail's path from authoritative GIS segments
 * (NPS / USFS / TDEC / OSM) before sampling elevation (#140). Government and OSM
 * trails come back as many disconnected segments in arbitrary order and
 * direction, so we stitch them into one ordered polyline by shared endpoints,
 * then orient the line to start at the trailhead.
 */
export type LatLng = { lat: number; lng: number };

function near(a: LatLng, b: LatLng, eps: number): boolean {
  return Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;
}

/**
 * Stitch segments into one ordered polyline. Starts from a terminus (an endpoint
 * used by only one segment) when there is one, then greedily extends, reversing
 * segments as needed. `eps` (degrees) tolerates sub-meter gaps between segments.
 * Disconnected leftovers are appended best-effort. Direction is arbitrary; use
 * `orientFromStart` to anchor it to the trailhead.
 */
export function stitchSegments(segments: LatLng[][], eps = 0.0002): LatLng[] {
  const segs = segments.filter((s) => s.length >= 2);
  if (segs.length <= 1) return segs[0] ? [...segs[0]] : [];

  const endpoints: LatLng[] = [];
  for (const s of segs) endpoints.push(s[0], s[s.length - 1]);
  const degree = (pt: LatLng) =>
    endpoints.reduce((n, e) => (near(e, pt, eps) ? n + 1 : n), 0);

  // Start at a terminus segment, oriented so the terminus comes first.
  let startIdx = 0;
  let startReversed = false;
  for (let i = 0; i < segs.length; i++) {
    if (degree(segs[i][0]) === 1) {
      startIdx = i;
      startReversed = false;
      break;
    }
    if (degree(segs[i][segs[i].length - 1]) === 1) {
      startIdx = i;
      startReversed = true;
      break;
    }
  }

  const used = new Array(segs.length).fill(false);
  const out: LatLng[] = startReversed
    ? [...segs[startIdx]].reverse()
    : [...segs[startIdx]];
  used[startIdx] = true;

  let extended = true;
  while (extended) {
    extended = false;
    const tail = out[out.length - 1];
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      const s = segs[i];
      if (near(s[0], tail, eps)) {
        out.push(...s.slice(1));
        used[i] = true;
        extended = true;
        break;
      }
      if (near(s[s.length - 1], tail, eps)) {
        out.push(...[...s].reverse().slice(1));
        used[i] = true;
        extended = true;
        break;
      }
    }
  }

  for (let i = 0; i < segs.length; i++) if (!used[i]) out.push(...segs[i]);
  return out;
}

/** Orient a polyline so it starts at whichever end is closest to the trailhead. */
export function orientFromStart(line: LatLng[], trailhead: LatLng): LatLng[] {
  if (line.length < 2) return line;
  const d = (a: LatLng) =>
    (a.lat - trailhead.lat) ** 2 + (a.lng - trailhead.lng) ** 2;
  return d(line[0]) <= d(line[line.length - 1]) ? line : [...line].reverse();
}

type GeoJson = {
  features?: Array<{
    geometry?: { type: string; coordinates: number[][] | number[][][] } | null;
  }>;
};

/** Segments from an Esri/NPS/USFS/TDEC GeoJSON FeatureCollection (`f=geojson`,
 *  `outSR=4326`), as [lng, lat] is flipped to {lat, lng}. */
export function npsSegments(fc: GeoJson): LatLng[][] {
  const segs: LatLng[][] = [];
  const toSeg = (line: number[][]) =>
    line.map(([lng, lat]) => ({ lat, lng }));
  for (const f of fc.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "LineString") segs.push(toSeg(g.coordinates as number[][]));
    else if (g.type === "MultiLineString")
      for (const line of g.coordinates as number[][][]) segs.push(toSeg(line));
  }
  return segs;
}

type OverpassJson = {
  elements?: Array<{
    type: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
};

/** Segments from an Overpass `out geom` response (way geometry → {lat, lng}). */
export function overpassSegments(json: OverpassJson): LatLng[][] {
  const segs: LatLng[][] = [];
  for (const el of json.elements ?? []) {
    if (el.type === "way" && el.geometry?.length) {
      segs.push(el.geometry.map((g) => ({ lat: g.lat, lng: g.lon })));
    }
  }
  return segs;
}

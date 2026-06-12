import type { LatLng } from "./route-geometry";
import type { WaypointType } from "./schema";

/**
 * Auto-discovery of named landmarks along a trail's route (#190).
 *
 * The route polyline (from #140) is the spine; this module turns authoritative
 * public feature data (USGS GNIS, NPS Public POIs, OpenStreetMap) into candidate
 * `waypoints` for a maintainer to curate. Everything here is pure and tested;
 * the network fetches live in `scripts/discover-waypoints.ts`.
 */

export type WaypointSource = "gnis" | "nps" | "osm";

export type WaypointCandidate = {
  lat: number;
  lng: number;
  name: string;
  type: WaypointType;
  source: WaypointSource;
};

const EARTH_R = 6_371_000; // meters
const M_PER_DEG_LAT = (Math.PI / 180) * EARTH_R;
const metersPerDegLng = (lat: number) =>
  (Math.PI / 180) * EARTH_R * Math.cos((lat * Math.PI) / 180);

/**
 * Distance in meters from point `p` to segment `ab`, via a local planar
 * projection centered on `p`. Accurate at trail scales (a few km), where the
 * curvature error is negligible compared with the ~100-250 m buffer.
 */
export function pointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const mLng = metersPerDegLng(p.lat);
  const ax = (a.lng - p.lng) * mLng;
  const ay = (a.lat - p.lat) * M_PER_DEG_LAT;
  const bx = (b.lng - p.lng) * mLng;
  const by = (b.lat - p.lat) * M_PER_DEG_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  // Project the origin (p) onto ab, clamped to the segment.
  let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(cx, cy);
}

/** Shortest distance in meters from `p` to a polyline. */
export function pointToPolylineMeters(p: LatLng, line: LatLng[]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return pointToSegmentMeters(p, line[0], line[0]);
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const d = pointToSegmentMeters(p, line[i], line[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

/** Great-circle-ish distance in meters between two points (planar, local). */
function distMeters(a: LatLng, b: LatLng): number {
  return pointToSegmentMeters(a, b, b);
}

// ---------------------------------------------------------------------------
// Source -> WaypointType mapping
// ---------------------------------------------------------------------------

/** USGS GNIS `gaz_featureclass` -> our type. */
function gnisType(featureClass: string): WaypointType {
  const c = featureClass.toLowerCase();
  if (c.includes("falls")) return "waterfall";
  if (c.includes("summit")) return "summit";
  if (c.includes("gap")) return "gap";
  if (c.includes("arch")) return "arch";
  if (c.includes("spring")) return "water";
  return "landmark";
}

/** NPS Public POIs `POITYPE` -> our type. */
function npsType(poiType: string): WaypointType {
  const t = poiType.toLowerCase();
  if (t.includes("waterfall")) return "waterfall";
  if (t.includes("view") || t.includes("overlook") || t.includes("vista"))
    return "viewpoint";
  if (t.includes("summit") || t.includes("peak")) return "summit";
  if (t.includes("camp")) return "campsite";
  if (t.includes("parking")) return "parking";
  if (t.includes("spring") || t.includes("water")) return "water";
  return "landmark";
}

/** OSM tags -> our type (first match wins). */
function osmType(
  tags: Record<string, string | undefined>,
): WaypointType | null {
  if (tags.waterway === "waterfall") return "waterfall";
  if (tags.natural === "peak") return "summit";
  if (tags.natural === "saddle") return "gap";
  if (tags.natural === "arch") return "arch";
  if (tags.natural === "spring") return "water";
  if (tags.tourism === "viewpoint") return "viewpoint";
  if (tags.tourism === "camp_site") return "campsite";
  return null;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

type GnisResponse = {
  features?: {
    attributes?: { gaz_name?: string; gaz_featureclass?: string };
    geometry?: { points?: number[][] };
  }[];
};

/** USGS National Map gazetteer (ArcGIS `f=json`, multipoint geometry). */
export function gnisWaypoints(json: GnisResponse): WaypointCandidate[] {
  const out: WaypointCandidate[] = [];
  for (const f of json.features ?? []) {
    const name = f.attributes?.gaz_name;
    const cls = f.attributes?.gaz_featureclass;
    const pt = f.geometry?.points?.[0];
    if (!name || !cls || !pt) continue;
    out.push({
      lat: pt[1],
      lng: pt[0],
      name,
      type: gnisType(cls),
      source: "gnis",
    });
  }
  return out;
}

type GeoJsonPointFC = {
  features?: {
    properties?: Record<string, unknown>;
    geometry?: { type?: string; coordinates?: number[] };
  }[];
};

/** NPS Public POIs (ArcGIS `f=geojson` FeatureCollection of Points). */
export function npsPoiWaypoints(fc: GeoJsonPointFC): WaypointCandidate[] {
  const out: WaypointCandidate[] = [];
  for (const f of fc.features ?? []) {
    const props = f.properties ?? {};
    const name = (props.POINAME ?? props.NAME ?? props.MAPLABEL) as
      | string
      | undefined;
    const poiType = (props.POITYPE ?? "") as string;
    const coords = f.geometry?.coordinates;
    if (!name || !coords || coords.length < 2) continue;
    out.push({
      lat: coords[1],
      lng: coords[0],
      name,
      type: npsType(poiType),
      source: "nps",
    });
  }
  return out;
}

type OverpassResponse = {
  elements?: {
    type?: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string | undefined>;
  }[];
};

/** OpenStreetMap Overpass (`out center`). Unnamed/untyped features are dropped. */
export function osmWaypoints(json: OverpassResponse): WaypointCandidate[] {
  const out: WaypointCandidate[] = [];
  for (const el of json.elements ?? []) {
    const tags = el.tags ?? {};
    const name = tags.name;
    const type = osmType(tags);
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!name || !type || lat == null || lon == null) continue;
    out.push({ lat, lng: lon, name, type, source: "osm" });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Filtering, dedupe, ordering
// ---------------------------------------------------------------------------

/** Keep only candidates within `bufferMeters` of the route polyline. */
export function filterNearRoute(
  candidates: WaypointCandidate[],
  route: LatLng[],
  bufferMeters = 150,
): WaypointCandidate[] {
  return candidates.filter(
    (c) => pointToPolylineMeters(c, route) <= bufferMeters,
  );
}

const SOURCE_PRIORITY: Record<WaypointSource, number> = {
  gnis: 0,
  nps: 1,
  osm: 2,
};

/**
 * Collapse duplicates. Two candidates are the same feature when they share a
 * normalized name, or are the same type within `coordMeters`. The kept copy is
 * the highest-priority source (GNIS canonical names > NPS > OSM).
 */
export function dedupeWaypoints(
  candidates: WaypointCandidate[],
  coordMeters = 60,
): WaypointCandidate[] {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const kept: WaypointCandidate[] = [];
  for (const c of [...candidates].sort(
    (a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source],
  )) {
    const dup = kept.find(
      (k) =>
        norm(k.name) === norm(c.name) ||
        (k.type === c.type && distMeters(k, c) <= coordMeters),
    );
    if (!dup) kept.push(c);
  }
  return kept;
}

/** Arc-length position (meters) of `p`'s nearest point along the route. */
function routePositionMeters(p: LatLng, route: LatLng[]): number {
  if (route.length < 2) return 0;
  let best = Infinity;
  let bestPos = 0;
  let acc = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const segLen = distMeters(a, b);
    const d = pointToSegmentMeters(p, a, b);
    if (d < best) {
      best = d;
      // Fraction along this segment of the projected point.
      const mLng = metersPerDegLng(p.lat);
      const ax = (a.lng - p.lng) * mLng;
      const ay = (a.lat - p.lat) * M_PER_DEG_LAT;
      const bx = (b.lng - p.lng) * mLng;
      const by = (b.lat - p.lat) * M_PER_DEG_LAT;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t =
        len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
      bestPos = acc + t * segLen;
    }
    acc += segLen;
  }
  return bestPos;
}

/** Order candidates by where they fall along the route (start -> end). */
export function orderAlongRoute(
  candidates: WaypointCandidate[],
  route: LatLng[],
): WaypointCandidate[] {
  return [...candidates].sort(
    (a, b) => routePositionMeters(a, route) - routePositionMeters(b, route),
  );
}

// ---------------------------------------------------------------------------
// Attribution + output
// ---------------------------------------------------------------------------

const ATTRIBUTION: Record<WaypointSource, string> = {
  gnis: "USGS GNIS (U.S. Geological Survey, public domain)",
  nps: "National Park Service Public POIs (public domain)",
  osm: "© OpenStreetMap contributors (ODbL)",
};

/** The attribution lines for whichever sources appear in `candidates`. */
export function attributionFor(candidates: WaypointCandidate[]): string[] {
  const present = new Set(candidates.map((c) => c.source));
  return (["gnis", "nps", "osm"] as const)
    .filter((s) => present.has(s))
    .map((s) => ATTRIBUTION[s]);
}

const num = (n: number) => (Object.is(n, -0) ? "0" : String(n));

/** Render candidates as a `waypoints:` front-matter block for review. */
export function candidateWaypointsYaml(candidates: WaypointCandidate[]): string {
  const lines = ["waypoints:"];
  for (const c of candidates) {
    lines.push(`  - lat: ${num(c.lat)}`);
    lines.push(`    lng: ${num(c.lng)}`);
    lines.push(`    name: ${c.name}`);
    lines.push(`    type: ${c.type}`);
    lines.push(`    # source: ${c.source}`);
  }
  return lines.join("\n");
}

/**
 * Auto-discover candidate `waypoints` along a trail's route (#190): fetch named
 * landmarks near the route polyline from authoritative public data (USGS GNIS,
 * NPS Public POIs, OpenStreetMap), keep only those within a buffer of the
 * route, dedupe across sources, order them along the route, and print a
 * `waypoints:` front-matter block for a maintainer to review and curate.
 *
 *   pnpm discover:waypoints <trail-slug> [--buffer METERS] [--source gnis|nps|osm]
 *
 * Prints the candidate YAML on stdout; prints counts and attribution on stderr.
 * GNIS and NPS data are public domain; OSM is ODbL ("© OpenStreetMap
 * contributors"). Requires the trail to already have a `route` (see
 * `pnpm import:route`).
 */
import type { LatLng } from "../src/lib/trails/route-geometry";
import {
  gnisWaypoints,
  npsPoiWaypoints,
  osmWaypoints,
  filterNearRoute,
  dedupeWaypoints,
  orderAlongRoute,
  attributionFor,
  candidateWaypointsYaml,
  type WaypointCandidate,
  type WaypointSource,
} from "../src/lib/trails/waypoint-discovery";
import { getTrailBySlug } from "../src/lib/trails";

const UA = {
  "User-Agent": "TennesseeHikingClub-waypoint-discovery (contact: tnhiking.club)",
};

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`non-JSON response (${res.status}): ${text.slice(0, 80)}`);
  }
}

type Bbox = { west: number; south: number; east: number; north: number };

/** Bounding box of the route, padded so features just off the ends are caught. */
function routeBbox(route: LatLng[], padDeg: number): Bbox {
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  return {
    west: Math.min(...lngs) - padDeg,
    south: Math.min(...lats) - padDeg,
    east: Math.max(...lngs) + padDeg,
    north: Math.max(...lats) + padDeg,
  };
}

const GNIS_BASE =
  "https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer";
// 5 = Landforms (Summit/Gap/Cliff/Arch), 7 = Hydrography (Falls/Spring).
const GNIS_LAYERS = [5, 7];
const NPS_POIS =
  "https://mapservices.nps.gov/arcgis/rest/services/NationalDatasets/NPS_Public_POIs/FeatureServer/0";

async function fetchGnis(b: Bbox): Promise<WaypointCandidate[]> {
  const out: WaypointCandidate[] = [];
  for (const layer of GNIS_LAYERS) {
    const env = `${b.west},${b.south},${b.east},${b.north}`;
    const url =
      `${GNIS_BASE}/${layer}/query?where=1%3D1&geometry=${env}` +
      `&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326` +
      `&spatialRel=esriSpatialRelIntersects` +
      `&outFields=gaz_name,gaz_featureclass&returnGeometry=true&f=json`;
    const json = await safeJson(
      await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (TennesseeHikingClub)" },
      }),
    );
    out.push(...gnisWaypoints(json as Parameters<typeof gnisWaypoints>[0]));
  }
  return out;
}

async function fetchNps(b: Bbox): Promise<WaypointCandidate[]> {
  const env = `${b.west},${b.south},${b.east},${b.north}`;
  const url =
    `${NPS_POIS}/query?where=1%3D1&geometry=${env}` +
    `&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326` +
    `&spatialRel=esriSpatialRelIntersects&outFields=POINAME,POITYPE` +
    `&returnGeometry=true&f=geojson`;
  const json = await safeJson(await fetch(url, { headers: UA }));
  return npsPoiWaypoints(json as Parameters<typeof npsPoiWaypoints>[0]);
}

async function fetchOsm(b: Bbox): Promise<WaypointCandidate[]> {
  const box = `${b.south},${b.west},${b.north},${b.east}`;
  const ql =
    `[out:json][timeout:60];(` +
    `node[waterway=waterfall](${box});` +
    `node[natural~"^(peak|saddle|arch|spring)$"](${box});` +
    `node[tourism~"^(viewpoint|camp_site)$"](${box});` +
    `way[tourism~"^(viewpoint|camp_site)$"](${box});` +
    `);out center;`;
  const json = await safeJson(
    await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: ql,
      headers: UA,
    }),
  );
  return osmWaypoints(json as Parameters<typeof osmWaypoints>[0]);
}

async function main() {
  const slug = process.argv[2];
  if (!slug || slug.startsWith("--")) {
    console.error(
      "usage: pnpm discover:waypoints <trail-slug> [--buffer METERS] [--source gnis|nps|osm]",
    );
    process.exit(1);
  }
  const buffer = Number(arg("--buffer") ?? 150);
  const only = arg("--source") as WaypointSource | undefined;

  const trail = await getTrailBySlug(slug);
  if (!trail) throw new Error(`no trail with slug "${slug}"`);
  if (!trail.route || trail.route.length < 2) {
    throw new Error(
      `trail "${slug}" has no route; run \`pnpm import:route ${slug}\` first`,
    );
  }
  const route: LatLng[] = trail.route.map((p) => ({ lat: p.lat, lng: p.lng }));
  // Pad the bbox by roughly the buffer (deg) plus a little slack.
  const bbox = routeBbox(route, buffer / 111_000 + 0.002);

  const sources: Record<WaypointSource, (b: Bbox) => Promise<WaypointCandidate[]>> =
    { gnis: fetchGnis, nps: fetchNps, osm: fetchOsm };

  const all: WaypointCandidate[] = [];
  for (const [name, fetcher] of Object.entries(sources) as [
    WaypointSource,
    (b: Bbox) => Promise<WaypointCandidate[]>,
  ][]) {
    if (only && only !== name) continue;
    try {
      const found = await fetcher(bbox);
      console.error(`${name}: ${found.length} feature(s) in bbox`);
      all.push(...found);
    } catch (e) {
      console.error(`${name}: skipped (${(e as Error).message})`);
    }
  }

  const near = filterNearRoute(all, route, buffer);
  const deduped = dedupeWaypoints(near);
  const ordered = orderAlongRoute(deduped, route);

  console.error(
    `\n${all.length} fetched -> ${near.length} within ${buffer} m -> ${ordered.length} after dedupe`,
  );
  if (ordered.length === 0) {
    console.error("No candidate waypoints found near this route.");
    return;
  }
  console.error("\nReview each candidate before committing. Attribution:");
  for (const line of attributionFor(ordered)) console.error(`  - ${line}`);
  console.error("");

  console.log(candidateWaypointsYaml(ordered));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

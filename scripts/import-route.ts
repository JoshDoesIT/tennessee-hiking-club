/**
 * Build a trail's `route` front-matter from authoritative public GIS (#140):
 * fetch the trail's geometry near its trailhead from the NPS public trails
 * service (Smokies / Big South Fork) or OpenStreetMap, stitch the segments into
 * one ordered polyline, orient it from the trailhead, and sample elevation from
 * USGS 3DEP (OpenTopoData `ned10m`).
 *
 *   pnpm import:route <trail-slug> [--source nps|osm] [--name "Official Name"] [--points N]
 *
 * Prints the `route:` YAML on stdout (paste it into the trail's front-matter).
 * Prints the matched source/name, length, and gain on stderr so you can
 * sanity-check against the trail's stated lengthMiles / elevationGainFt. NPS and
 * USGS data are public domain; OSM is ODbL ("© OpenStreetMap contributors").
 */
import {
  stitchSegments,
  orientFromStart,
  type LatLng,
} from "../src/lib/trails/route-geometry";
import {
  downsampleRoute,
  routeFrontmatterYaml,
  metersToFeet,
} from "../src/lib/trails/route-import";
import { buildElevationProfile } from "../src/lib/trails/elevation";
import { getTrailBySlug } from "../src/lib/trails";

type Candidate = { name: string; segments: LatLng[][] };

const UA = { "User-Agent": "TennesseeHikingClub-route-importer (contact: tnhiking.club)" };

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function haversineMi(a: LatLng, b: LatLng): number {
  const R = 3958.8,
    t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t,
    dLng = (b.lng - a.lng) * t;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Token-overlap score between a trail's display name and a source trail name. */
function nameScore(appName: string, srcName: string): number {
  const norm = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean));
  const a = norm(appName),
    b = norm(srcName);
  let shared = 0;
  for (const t of b) if (a.has(t)) shared++;
  return shared;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`non-JSON response (${res.status}): ${text.slice(0, 80)}`);
  }
}

async function fetchEsri(
  base: string,
  nameField: string,
  th: LatLng,
  d: number,
): Promise<Candidate[]> {
  const env = `${th.lng - d},${th.lat - d},${th.lng + d},${th.lat + d}`;
  const url =
    `${base}/query?where=1%3D1&geometry=${env}&geometryType=esriGeometryEnvelope&inSR=4326` +
    `&spatialRel=esriSpatialRelIntersects&outFields=${nameField}&returnGeometry=true&outSR=4326&f=geojson`;
  // Some state servers (TDEC) 403 a non-browser UA, so present a browser one.
  const fc = (await safeJson(
    await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (TennesseeHikingClub route importer)" } }),
  )) as { features?: Array<{ properties?: Record<string, string>; geometry?: { type: string; coordinates: number[][] | number[][][] } }> };
  const byName = new Map<string, LatLng[][]>();
  const toSeg = (line: number[][]) => line.map(([lo, la]) => ({ lat: la, lng: lo }));
  for (const f of fc.features ?? []) {
    const name = f.properties?.[nameField] ?? "(unnamed)";
    const g = f.geometry;
    const segs: LatLng[][] = [];
    if (g?.type === "LineString") segs.push(toSeg(g.coordinates as number[][]));
    else if (g?.type === "MultiLineString")
      (g.coordinates as number[][][]).forEach((l) => segs.push(toSeg(l)));
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push(...segs);
  }
  return [...byName].map(([name, segments]) => ({ name, segments }));
}

const NPS_TRAILS =
  "https://mapservices.nps.gov/arcgis/rest/services/NationalDatasets/NPS_Public_Trails_Geographic/FeatureServer/0";
const TDEC_TRAILS =
  "https://tdeconline.tn.gov/arcgis/rest/services/TDEC_Trails/FeatureServer/0";

async function fetchOsm(th: LatLng): Promise<Candidate[]> {
  const ql = `[out:json][timeout:60];way[highway~"^(path|footway|track)$"][name](around:2500,${th.lat},${th.lng});out geom;`;
  const json = (await safeJson(
    await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: ql, headers: UA }),
  )) as { elements?: Array<{ type: string; tags?: Record<string, string>; geometry?: Array<{ lat: number; lon: number }> }> };
  const byName = new Map<string, LatLng[][]>();
  for (const el of json.elements ?? []) {
    if (el.type === "way" && el.geometry?.length) {
      const name = el.tags?.name ?? "(unnamed)";
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(el.geometry.map((p: { lat: number; lon: number }) => ({ lat: p.lat, lng: p.lon })));
    }
  }
  return [...byName].map(([name, segments]) => ({ name, segments }));
}

/** Closest approach (mi) of a candidate's points to the trailhead. */
function distToTrailhead(c: Candidate, th: LatLng): number {
  let min = Infinity;
  for (const seg of c.segments) for (const p of seg) min = Math.min(min, haversineMi(p, th));
  return min;
}

async function sampleElevationFt(points: LatLng[]): Promise<number[]> {
  const locs = points.map((p) => `${p.lat},${p.lng}`).join("|");
  const res = await fetch("https://api.opentopodata.org/v1/ned10m", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...UA },
    body: JSON.stringify({ locations: locs, interpolation: "bilinear" }),
  });
  const json = await res.json();
  if (json.status !== "OK") throw new Error("elevation lookup failed: " + JSON.stringify(json).slice(0, 200));
  return json.results.map((r: { elevation: number }) => metersToFeet(r.elevation));
}

async function main() {
  const slug = process.argv[2];
  if (!slug || slug.startsWith("--")) {
    console.error('Usage: pnpm import:route <trail-slug> [--source nps|osm] [--name "Official Name"] [--points N]');
    process.exit(1);
  }
  const trail = getTrailBySlug(slug);
  if (!trail) {
    console.error(`No trail found for slug "${slug}".`);
    process.exit(1);
  }
  const th: LatLng = { lat: trail.coordinates.lat, lng: trail.coordinates.lng };
  const forced = arg("--source") as "nps" | "tdec" | "osm" | undefined;
  const forcedName = arg("--name");
  const maxPoints = Number(arg("--points")) || 70;

  const SOURCES: Record<string, () => Promise<Candidate[]>> = {
    nps: () => fetchEsri(NPS_TRAILS, "TRLNAME", th, 0.06),
    tdec: () => fetchEsri(TDEC_TRAILS, "TR_NAME", th, 0.06),
    osm: () => fetchOsm(th),
  };
  // Tag each candidate with the source it came from so we can attribute it.
  const order = forced ? [forced] : ["nps", "tdec", "osm"];
  const tagged: Array<Candidate & { source: string }> = [];
  for (const src of order) {
    try {
      const cands = await SOURCES[src]();
      tagged.push(...cands.map((c) => ({ ...c, source: src })));
    } catch (e) {
      console.error(`(${src} lookup skipped: ${(e as Error).message})`);
    }
  }

  // Viable = passes within ~120 m of the trailhead AND (auto mode) shares a name
  // token with the trail, so we never silently pick the wrong nearby trail.
  const viable = tagged.filter((c) => distToTrailhead(c, th) < 0.075);
  const matches = forcedName
    ? viable.filter((c) => c.name.toLowerCase().includes(forcedName.toLowerCase()))
    : viable.filter((c) => nameScore(trail.name, c.name) > 0);

  if (matches.length === 0) {
    console.error(
      forcedName
        ? `No trail near the trailhead matched --name "${forcedName}".`
        : `No source trail near the trailhead matched "${trail.name}" by name.`,
    );
    console.error("Trails that pass near the trailhead (re-run with --source/--name):");
    viable
      .sort((a, b) => distToTrailhead(a, th) - distToTrailhead(b, th))
      .slice(0, 10)
      .forEach((c) =>
        console.error(`  - [${c.source}] ${c.name} (${(distToTrailhead(c, th) * 5280).toFixed(0)} ft away)`),
      );
    process.exit(1);
  }

  const rank: Record<string, number> = { nps: 0, tdec: 1, osm: 2 };
  const chosen = matches.sort((a, b) =>
    nameScore(trail.name, b.name) - nameScore(trail.name, a.name) ||
    (rank[a.source] ?? 9) - (rank[b.source] ?? 9) ||
    distToTrailhead(a, th) - distToTrailhead(b, th),
  )[0];
  const source = chosen.source;

  const line = orientFromStart(stitchSegments(chosen.segments), th);
  const sampled = downsampleRoute(line, maxPoints);
  const elevations = await sampleElevationFt(sampled);
  const route = sampled.map((p, i) => ({ lat: p.lat, lng: p.lng, elevationFt: elevations[i] }));
  const profile = buildElevationProfile(route);

  // A match far shorter than the stated length is almost always the wrong
  // feature (e.g. a short overlook spur sharing a word with the trail name).
  if (trail.lengthMiles && profile.totalMiles < trail.lengthMiles * 0.25) {
    console.error(
      `Matched "${chosen.name}" is only ${profile.totalMiles.toFixed(2)} mi vs the trail's ` +
        `stated ${trail.lengthMiles} mi — likely the wrong feature. Re-run with ` +
        `--name "<official trail name>" or --source.`,
    );
    process.exit(1);
  }

  console.error(`\nSource: ${source.toUpperCase()} — "${chosen.name}"`);
  console.error(`Points: ${route.length} (from ${line.length} geometry points)`);
  console.error(`Length: ${profile.totalMiles.toFixed(2)} mi  (trail says ${trail.lengthMiles ?? "?"} mi)`);
  console.error(`Gain:   ${profile.gainFt} ft  (trail says ${trail.elevationGainFt ?? "?"} ft)`);
  console.error(`Low/High: ${profile.lowFt}/${profile.highFt} ft`);
  const ATTRIB: Record<string, string> = {
    nps: "National Park Service (public domain)",
    tdec: "TN State Parks / TDEC (open data)",
    osm: "© OpenStreetMap contributors (ODbL)",
  };
  console.error(`Attribution: ${ATTRIB[source] ?? source}\n`);
  console.log(routeFrontmatterYaml(route));
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});

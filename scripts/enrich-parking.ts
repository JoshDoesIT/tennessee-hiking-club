/**
 * Build-time parking enrichment (#141). For every trail that declares no
 * `parking`, query the OpenStreetMap Overpass API for the nearest
 * `amenity=parking` to the trailhead and cache it into
 * `content/osm-parking.json`. The site reads that cache at build, so pages stay
 * static and never call Overpass at request time. Run it periodically and commit
 * the result:
 *
 *   pnpm enrich:parking
 *
 * Existing declared parking always wins (those trails are skipped). No API key
 * is needed; we are polite (one request at a time, with a short delay).
 */
import fs from "node:fs";
import path from "node:path";
import { getAllTrails } from "../src/lib/trails/index";
import {
  overpassParkingQuery,
  selectNearestParking,
  type OverpassElement,
  type OsmParkingMap,
} from "../src/lib/trails/osm-parking";

const OUT_FILE = path.join(process.cwd(), "content", "osm-parking.json");
const ENDPOINT = "https://overpass-api.de/api/interpreter";
const MAX_MILES = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchParking(coords: { lat: number; lng: number }) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      // Overpass asks clients to identify themselves.
      "User-Agent":
        "tennessee-hiking-club/parking-enrichment (+https://github.com/JoshDoesIT/tennessee-hiking-club)",
    },
    body: `data=${encodeURIComponent(overpassParkingQuery(coords))}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = (await res.json()) as { elements?: OverpassElement[] };
  return selectNearestParking(json.elements ?? [], coords, MAX_MILES);
}

async function main() {
  const trails = getAllTrails().filter((t) => !t.parking);
  const map: OsmParkingMap = {};
  console.log(`Enriching ${trails.length} trail(s) without declared parking…`);

  for (const trail of trails) {
    try {
      const lot = await fetchParking(trail.coordinates);
      if (lot) {
        map[trail.slug] = lot;
        console.log(`  ✓ ${trail.slug}: ${lot.name ?? "parking"}`);
      } else {
        console.log(`  – ${trail.slug}: no nearby parking`);
      }
    } catch (err) {
      console.warn(`  ! ${trail.slug}: ${(err as Error).message}`);
    }
    await sleep(1200); // be polite to the public Overpass instance
  }

  const sorted = Object.fromEntries(
    Object.keys(map)
      .sort()
      .map((k) => [k, map[k]]),
  );
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(
    `Wrote ${Object.keys(sorted).length} lot(s) to ${path.relative(process.cwd(), OUT_FILE)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

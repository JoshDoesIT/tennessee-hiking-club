/**
 * Build-time elevation backfill (#137). For every trail whose `route` has points
 * without `elevationFt`, sample the public-domain USGS 3DEP terrain DEM
 * (OpenTopoData `ned10m`, the same data behind the detail map; no API key) and
 * write the elevations into the route block in place. This lets a route be
 * authored as bare lat/lng (hand-traced, or a GPX with no elevation, or a
 * member-recorded track from #201) and still get a profile and GPX. Run it and
 * commit the result; the site reads the committed content at build, so pages
 * stay static and never call the DEM at request time:
 *
 *   pnpm enrich:elevation
 *
 * Routes that already carry full elevation are skipped. If the DEM can't resolve
 * every point (no coverage), the trail is left as-is and its profile simply does
 * not render until elevation is supplied.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { sampleElevationFeet } from "../src/lib/trails/dem";
import {
  replaceRouteBlock,
  routeFrontmatterYaml,
} from "../src/lib/trails/route-import";

const DIR = path.join(process.cwd(), "content", "trails");

type Pt = { lat: number; lng: number; elevationFt?: number };

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
  let enriched = 0;
  for (const file of files) {
    const full = path.join(DIR, file);
    const text = fs.readFileSync(full, "utf8");
    const route = (matter(text).data.route ?? []) as Pt[];
    if (route.length < 2) continue;
    if (route.every((p) => typeof p.elevationFt === "number")) continue;

    const missing = route.filter(
      (p) => typeof p.elevationFt !== "number",
    ).length;
    process.stderr.write(`${file}: sampling DEM for ${missing} point(s)...\n`);
    const elevations = await sampleElevationFeet(
      route.map((p) => ({ lat: p.lat, lng: p.lng })),
    );
    if (elevations.some((v) => v == null)) {
      process.stderr.write(
        `  skipped: the DEM has no coverage for every point\n`,
      );
      continue;
    }
    const filled = route.map((p, i) => ({
      lat: p.lat,
      lng: p.lng,
      elevationFt: elevations[i] as number,
    }));
    fs.writeFileSync(
      full,
      replaceRouteBlock(text, routeFrontmatterYaml(filled)),
    );
    enriched++;
    process.stderr.write(`  filled elevation\n`);
  }
  process.stderr.write(
    enriched
      ? `\nEnriched ${enriched} trail(s). Review and commit the changes.\n`
      : `\nAll routes already have elevation; nothing to do.\n`,
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

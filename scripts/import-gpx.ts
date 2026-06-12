/**
 * Convert a real `.gpx` track (an official park route or a recorded hike) into
 * the `route` front-matter for a trail (#140). The GPX carries the geometry and
 * elevation, so the result is an accurate, downloadable route, not a guess.
 *
 *   pnpm import:gpx path/to/track.gpx [maxPoints]
 *
 * Prints the `route:` YAML block on stdout (paste it into the trail's
 * front-matter); prints the sampled gain and length on stderr so you can
 * sanity-check them against the trail's stated `elevationGainFt` / `lengthMiles`.
 */
import fs from "node:fs";
import {
  parseGpxTrack,
  downsampleRoute,
  routeFrontmatterYaml,
} from "../src/lib/trails/route-import";
import { buildElevationProfile } from "../src/lib/trails/elevation";

const file = process.argv[2];
if (!file) {
  console.error("Usage: pnpm import:gpx <track.gpx> [maxPoints]");
  process.exit(1);
}
const maxPoints = Number(process.argv[3]) || 80;

const { name, points } = parseGpxTrack(fs.readFileSync(file, "utf8"));
if (points.length < 2) {
  console.error("No elevation-bearing track points found in the GPX.");
  process.exit(1);
}

const route = downsampleRoute(points, maxPoints);
const profile = buildElevationProfile(route);

console.error(
  `# ${name ?? "(unnamed track)"}: ${points.length} points -> ${route.length} sampled`,
);
console.error(
  `# sourced gain ${profile.gainFt} ft, length ${profile.totalMiles.toFixed(2)} mi ` +
    `(sanity-check against the trail's stated elevationGainFt / lengthMiles)`,
);
console.log(routeFrontmatterYaml(route));

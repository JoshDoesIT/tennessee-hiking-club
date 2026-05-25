/**
 * Validates all trail content against the schema. Runs in `prebuild`, so an
 * invalid or malformed trail file fails `pnpm build` (and CI) with a clear,
 * descriptive error instead of shipping broken content.
 */
import { getAllTrails } from "../src/lib/trails/index";

try {
  const trails = getAllTrails();

  if (trails.length === 0) {
    console.error("✗ No trails found in content/trails/.");
    process.exit(1);
  }

  const byRegion = trails.reduce<Record<string, number>>((acc, trail) => {
    acc[trail.region] = (acc[trail.region] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(byRegion)
    .map(([region, count]) => `${region}: ${count}`)
    .join(", ");

  console.log(`✓ ${trails.length} trail(s) valid (${summary}).`);
} catch (error) {
  console.error(
    `✗ Trail content validation failed:\n  ${(error as Error).message}`,
  );
  process.exit(1);
}

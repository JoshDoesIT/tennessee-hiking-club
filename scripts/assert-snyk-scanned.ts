/**
 * CLI wrapper for `checkSnykScanned`: reads a captured `snyk test` log and
 * exits non-zero if the scan was incomplete. Called by .github/workflows/snyk.yml
 * after each scan, so an under-scanning run fails the check instead of passing
 * it. See scripts/snyk-output.ts for why this is needed.
 *
 * Usage: tsx scripts/assert-snyk-scanned.ts <path-to-snyk-log>
 */
import { readFileSync } from "node:fs";
import { checkSnykScanned } from "./snyk-output";

const logPath = process.argv[2];

if (!logPath) {
  console.error("Usage: tsx scripts/assert-snyk-scanned.ts <path-to-snyk-log>");
  process.exit(2);
}

const result = checkSnykScanned(readFileSync(logPath, "utf8"));

if (!result.ok) {
  // GitHub Actions annotation, so the reason shows on the check summary.
  console.error(`::error::${result.reason}`);
  process.exit(1);
}

console.log("✓ Snyk scanned every project it detected.");

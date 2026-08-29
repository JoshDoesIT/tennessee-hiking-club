/**
 * Guards against a *silent* Snyk pass.
 *
 * `snyk test` exits 0 when a project it detected fails to resolve - it reports
 * the failure on stdout and moves on. A required check can therefore stay green
 * while scanning almost nothing, which is what happened to this repo's two
 * Gradle projects: they referenced the generated
 * `android/capacitor-cordova-android-plugins/` directory, which is gitignored
 * and so absent on a clean CI checkout, and every run logged
 * "2/2 detected Gradle manifests did not return dependencies" and passed.
 *
 * The workflow pipes Snyk's output through here so an incomplete scan is red.
 */

/** Snyk's own wording when it detected a project but could not resolve it. */
const UNRESOLVED_PATTERNS = [
  /^.*\bdetected .* did not return dependencies\.?$/im,
  /^.*\bpotential projects failed to get dependencies\.?$/im,
  /^.*\bFailed to get dependencies for all sub-projects\.?$/im,
];

/**
 * Snyk's success wording, in both its single-project ("Tested 214
 * dependencies…") and multi-project ("Tested 10 projects…") forms. The count
 * must be non-zero: "Tested 0 dependencies" means nothing was scanned.
 */
const TESTED_SOMETHING = /\bTested [1-9]\d* (?:dependencies|projects)\b/;

export type SnykScanCheck = { ok: true } | { ok: false; reason: string };

export function checkSnykScanned(output: string): SnykScanCheck {
  for (const pattern of UNRESOLVED_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      return {
        ok: false,
        reason: `Snyk could not resolve every project it detected, so this scan is incomplete: ${match[0].trim()}`,
      };
    }
  }

  if (!TESTED_SOMETHING.test(output)) {
    return {
      ok: false,
      reason:
        "Snyk did not report testing any project's dependencies; refusing to pass a scan that covered nothing.",
    };
  }

  return { ok: true };
}

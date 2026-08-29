import { describe, it, expect } from "vitest";
import { checkSnykScanned } from "./snyk-output";

/**
 * Snyk exits 0 when a project it detected fails to resolve, so a *required*
 * check can stay green while scanning nothing. These fixtures are trimmed from
 * real CI output.
 */

const CLEAN_NPM = `
Testing /home/runner/work/tennessee-hiking-club/tennessee-hiking-club...

Organization:      joshdoesit
Package manager:   npm
Target file:       package.json
Project name:      tennessee-hiking-club
Open source:       no

✔ Tested 214 dependencies for known issues, no vulnerable paths found.
`;

const CLEAN_MULTI_PROJECT = `
Tested 10 projects, no vulnerable paths were found.
`;

// The regression this guard exists for: Snyk saw three projects, resolved one,
// and still exited 0.
const GRADLE_UNRESOLVED = `
✔ Tested 214 dependencies for known issues, no vulnerable paths found.

✗ 2/2 detected Gradle manifests did not return dependencies.

Tested 1 projects, no vulnerable paths were found.

✗ 2/3 potential projects failed to get dependencies.
`;

/** Asserts the guard rejected this output, and hands back its reason. */
function rejectionReason(output: string): string {
  const result = checkSnykScanned(output);
  if (result.ok) {
    throw new Error("expected checkSnykScanned to reject this output");
  }
  return result.reason;
}

describe("checkSnykScanned", () => {
  it("passes a clean single-project scan", () => {
    expect(checkSnykScanned(CLEAN_NPM)).toEqual({ ok: true });
  });

  it("passes a clean multi-project scan", () => {
    expect(checkSnykScanned(CLEAN_MULTI_PROJECT)).toEqual({ ok: true });
  });

  it("fails when detected manifests did not return dependencies", () => {
    expect(rejectionReason(GRADLE_UNRESOLVED)).toMatch(
      /did not return dependencies/,
    );
  });

  it("fails when potential projects failed to get dependencies", () => {
    expect(
      rejectionReason(`
✔ Tested 214 dependencies for known issues, no vulnerable paths found.

✗ 1/2 potential projects failed to get dependencies.
`),
    ).toMatch(/failed to get dependencies/);
  });

  it("fails on the iOS SPM manifest Snyk detects but cannot resolve", () => {
    // Real output from the first run of this workflow: Snyk found
    // ios/App/CapApp-SPM/Package.swift, could not build a tree from its
    // local `path:` dependencies, and still exited 0.
    expect(
      rejectionReason(`
/home/runner/work/tennessee-hiking-club/tennessee-hiking-club/ios/App/CapApp-SPM/Package.swift:
  Unable to generate dependency tree
✗ 1/2 potential projects failed to get dependencies.

✔ Tested 216 dependencies for known issues, no vulnerable paths found.
`),
    ).toMatch(/failed to get dependencies/);
  });

  it("fails when no target file could be detected at all", () => {
    expect(
      rejectionReason(
        "Could not detect supported target files in /home/runner/work/app.",
      ),
    ).toMatch(/did not report testing any project/i);
  });

  it("fails when Snyk reports testing zero dependencies", () => {
    expect(
      rejectionReason(
        "✔ Tested 0 dependencies for known issues, no vulnerable paths found.",
      ),
    ).toMatch(/did not report testing any project/i);
  });

  it("fails on empty output", () => {
    expect(checkSnykScanned("").ok).toBe(false);
  });

  it("is not fooled by the phrase appearing in a package name", () => {
    // Guard on the real message shape, not a loose substring.
    expect(
      checkSnykScanned(
        "✔ Tested 3 dependencies for known issues, no vulnerable paths found.\n" +
          "Introduced through: did-not-return-dependencies-parser@1.0.0\n",
      ),
    ).toEqual({ ok: true });
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadTrailsFrom, getTrailBySlug } from "./index";

function writeTrail(
  dir: string,
  file: string,
  frontmatter: string,
  body = "Body.",
) {
  fs.writeFileSync(path.join(dir, file), `---\n${frontmatter}\n---\n${body}\n`);
}

const VIRGIN = `slug: virgin-falls
name: Virgin Falls
region: Middle
area: Virgin Falls State Natural Area
coordinates:
  lat: 35.8267
  lng: -85.2861
lengthMiles: 8.6
elevationGainFt: 1610
difficulty: strenuous
routeType: out-and-back
tags: [waterfall]
photos: []
summary: A strenuous trek to a 110-ft waterfall.`;

const ALUM = `slug: alum-cave
name: Alum Cave Trail
region: East
area: Great Smoky Mountains National Park
coordinates:
  lat: 35.6285
  lng: -83.4513
lengthMiles: 4.4
elevationGainFt: 1200
difficulty: moderate
routeType: out-and-back
tags: [views]
photos: []
summary: A scenic climb past Arch Rock to Alum Cave Bluffs.`;

describe("loadTrailsFrom", () => {
  let dir: string;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "thc-trails-"));
    writeTrail(dir, "virgin-falls.md", VIRGIN);
    writeTrail(dir, "alum-cave.md", ALUM);
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("loads and validates all trails, sorted by name", () => {
    const trails = loadTrailsFrom(dir);
    expect(trails.map((t) => t.name)).toEqual([
      "Alum Cave Trail",
      "Virgin Falls",
    ]);
  });

  it("returns an empty array for a missing directory", () => {
    expect(loadTrailsFrom(path.join(dir, "nope"))).toEqual([]);
  });

  it("throws a descriptive error naming the file and field for invalid data", () => {
    const bad = fs.mkdtempSync(path.join(os.tmpdir(), "thc-bad-"));
    writeTrail(
      bad,
      "broken.md",
      VIRGIN.replace("region: Middle", "region: North"),
    );
    expect(() => loadTrailsFrom(bad)).toThrow(/broken\.md.*region/);
    fs.rmSync(bad, { recursive: true, force: true });
  });

  it("throws on duplicate slugs", () => {
    const dup = fs.mkdtempSync(path.join(os.tmpdir(), "thc-dup-"));
    writeTrail(dup, "a.md", VIRGIN);
    writeTrail(dup, "b.md", VIRGIN);
    expect(() => loadTrailsFrom(dup)).toThrow(/[Dd]uplicate.*virgin-falls/);
    fs.rmSync(dup, { recursive: true, force: true });
  });
});

describe("getTrailBySlug", () => {
  let dir: string;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "thc-slug-"));
    writeTrail(dir, "virgin-falls.md", VIRGIN);
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("resolves a known slug", () => {
    expect(getTrailBySlug("virgin-falls", dir)?.name).toBe("Virgin Falls");
  });

  it("returns null for a missing slug", () => {
    expect(getTrailBySlug("does-not-exist", dir)).toBeNull();
  });
});

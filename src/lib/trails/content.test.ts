import { describe, it, expect } from "vitest";
import { getAllTrails } from "./index";
import { REGIONS } from "./schema";

// Validates the real seeded content in content/trails/. getAllTrails() throws
// on any invalid file, so loading the set at all is part of the assertion.
const trails = getAllTrails();

describe("seeded trail content", () => {
  it("includes at least 8 valid trails", () => {
    expect(trails.length).toBeGreaterThanOrEqual(8);
  });

  it("covers all three Grand Divisions", () => {
    const regions = new Set(trails.map((t) => t.region));
    for (const region of REGIONS) {
      expect(regions.has(region)).toBe(true);
    }
  });

  it("gives every trail at least one photo and a non-empty summary", () => {
    for (const trail of trails) {
      expect(trail.photos.length).toBeGreaterThanOrEqual(1);
      expect(trail.summary.length).toBeGreaterThan(0);
    }
  });

  it("includes the flagship hikes", () => {
    const slugs = new Set(trails.map((t) => t.slug));
    for (const slug of [
      "mt-leconte-alum-cave",
      "roan-highlands-balds",
      "fall-creek-falls",
      "virgin-falls",
    ]) {
      expect(slugs.has(slug)).toBe(true);
    }
  });
});

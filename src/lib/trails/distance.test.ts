import { describe, it, expect } from "vitest";
import { trailsByDistance } from "./distance";

const trails = [
  { slug: "far", coordinates: { lat: 36.3, lng: -82.0 } },
  { slug: "near", coordinates: { lat: 35.96, lng: -83.92 } },
  { slug: "mid", coordinates: { lat: 35.6, lng: -85.3 } },
];

describe("trailsByDistance", () => {
  const me = { lat: 35.96, lng: -83.92 }; // Knoxville-ish, on top of "near"

  it("sorts nearest first and tags each with a distance", () => {
    const sorted = trailsByDistance(trails, me);
    expect(sorted.map((t) => t.slug)).toEqual(["near", "mid", "far"]);
    expect(sorted[0].distanceMi).toBeCloseTo(0, 0);
    expect(sorted[1].distanceMi).toBeGreaterThan(sorted[0].distanceMi);
  });

  it("does not mutate the input array", () => {
    const before = trails.map((t) => t.slug);
    trailsByDistance(trails, me);
    expect(trails.map((t) => t.slug)).toEqual(before);
  });
});

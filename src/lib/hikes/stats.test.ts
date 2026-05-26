import { describe, it, expect } from "vitest";
import { computeStats } from "./stats";
import type { Trail } from "@/lib/trails/schema";
import type { HikeLogEntry } from "./types";

const make = (over: Partial<Trail>): Trail => ({
  slug: "x",
  name: "X",
  region: "East",
  area: "A",
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 5,
  elevationGainFt: 1000,
  difficulty: "moderate",
  routeType: "loop",
  tags: [],
  photos: [],
  summary: "s",
  body: "",
  ...over,
});

const trails: Trail[] = [
  make({
    slug: "a",
    region: "East",
    area: "Smokies",
    lengthMiles: 11,
    elevationGainFt: 2000,
  }),
  make({
    slug: "b",
    region: "Middle",
    area: "Plateau",
    lengthMiles: 2,
    elevationGainFt: 400,
  }),
  make({
    slug: "c",
    region: "West",
    area: "Bottomland",
    lengthMiles: 1.2,
    elevationGainFt: 50,
  }),
];

describe("computeStats", () => {
  it("counts hikes, distinct trails, regions (in order), and areas", () => {
    const log: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01" },
      { trailSlug: "a", hikedOn: "2026-02-01" },
      { trailSlug: "b", hikedOn: "2026-03-01" },
    ];
    const s = computeStats(log, trails);
    expect(s.hikes).toBe(3);
    expect(s.trails).toBe(2);
    expect(s.regions).toEqual(["East", "Middle"]);
    expect(s.areas).toBe(2);
  });

  it("sums miles and elevation across all logged hikes (repeats count)", () => {
    const log: HikeLogEntry[] = [
      { trailSlug: "a", hikedOn: "2026-01-01" },
      { trailSlug: "a", hikedOn: "2026-02-01" },
    ];
    const s = computeStats(log, trails);
    expect(s.miles).toBe(22);
    expect(s.elevationFt).toBe(4000);
  });

  it("ignores entries for unknown trails", () => {
    const s = computeStats(
      [{ trailSlug: "ghost", hikedOn: "2026-01-01" }],
      trails,
    );
    expect(s.hikes).toBe(0);
    expect(s.trails).toBe(0);
    expect(s.regions).toEqual([]);
  });
});

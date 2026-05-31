import { describe, it, expect } from "vitest";
import { trailSchema } from "./schema";

const validTrail = {
  slug: "virgin-falls",
  name: "Virgin Falls",
  region: "Middle",
  area: "Virgin Falls State Natural Area",
  coordinates: { lat: 35.8267, lng: -85.2861 },
  lengthMiles: 8.6,
  elevationGainFt: 1610,
  difficulty: "strenuous",
  routeType: "out-and-back",
  tags: ["waterfall"],
  photos: [{ src: "/trails/virgin-falls/falls.jpg", alt: "Virgin Falls" }],
  summary: "A strenuous trek to a 110-ft waterfall.",
  body: "Full description of the hike.",
};

describe("trailSchema", () => {
  it("accepts a valid trail", () => {
    expect(trailSchema.safeParse(validTrail).success).toBe(true);
  });

  it("accepts trails with typed waypoints", () => {
    const withWaypoints = {
      ...validTrail,
      waypoints: [
        { lat: 35.83, lng: -85.29, name: "Big Branch Falls", type: "waterfall", description: "110-ft drop" },
        { lat: 35.84, lng: -85.3, name: "Overlook", type: "viewpoint" },
      ],
    };
    expect(trailSchema.safeParse(withWaypoints).success).toBe(true);
  });

  it("rejects an unknown waypoint type", () => {
    const bad = { ...validTrail, waypoints: [{ lat: 35.83, lng: -85.29, name: "X", type: "dragon" }] };
    expect(trailSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a waypoint outside Tennessee", () => {
    const bad = { ...validTrail, waypoints: [{ lat: 40, lng: -100, name: "X", type: "summit" }] };
    expect(trailSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a missing required field (name)", () => {
    const incomplete = { ...validTrail } as Record<string, unknown>;
    delete incomplete.name;
    expect(trailSchema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects an invalid region", () => {
    expect(
      trailSchema.safeParse({ ...validTrail, region: "North" }).success,
    ).toBe(false);
  });

  it("rejects a non-kebab-case slug", () => {
    expect(
      trailSchema.safeParse({ ...validTrail, slug: "Virgin Falls" }).success,
    ).toBe(false);
  });

  it("rejects coordinates outside Tennessee", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        coordinates: { lat: 33.749, lng: -84.388 },
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive length", () => {
    expect(
      trailSchema.safeParse({ ...validTrail, lengthMiles: 0 }).success,
    ).toBe(false);
  });

  it("accepts pinned alerts and condition reports", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        alerts: [
          { level: "closure", message: "Footbridge out", date: "2026-05-01" },
        ],
        conditionReports: [
          { date: "2026-05-20", status: "Muddy", note: "Slick near the base" },
        ],
      }).success,
    ).toBe(true);
  });

  it("defaults alerts and conditionReports to empty arrays", () => {
    const trail = trailSchema.parse(validTrail);
    expect(trail.alerts).toEqual([]);
    expect(trail.conditionReports).toEqual([]);
  });

  it("rejects an unknown alert level", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        alerts: [{ level: "danger", message: "x", date: "2026-05-01" }],
      }).success,
    ).toBe(false);
  });

  it("accepts an optional route of elevation points", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        route: [
          { lat: 35.6, lng: -83.45, elevationFt: 4000 },
          { lat: 35.62, lng: -83.44, elevationFt: 4600 },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects a route point missing elevation", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        route: [{ lat: 35.6, lng: -83.45 }],
      }).success,
    ).toBe(false);
  });

  it("accepts optional parking with notes", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        parking: {
          lat: 35.83,
          lng: -85.29,
          note: "Gravel lot, ~20 spaces, no fee. 2WD ok.",
          seasonal: "Access road gated dusk to dawn.",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects parking outside Tennessee", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        parking: { lat: 33.7, lng: -84.4 },
      }).success,
    ).toBe(false);
  });

  it("accepts contributor attribution on the trail, reports, and photos", () => {
    expect(
      trailSchema.safeParse({
        ...validTrail,
        contributors: ["octocat"],
        conditionReports: [{ date: "2026-05-20", status: "Open", by: "octocat" }],
        photos: [
          { src: "/p.jpg", alt: "x", credit: "Octocat, CC0", by: "octocat" },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty contributor handle", () => {
    expect(
      trailSchema.safeParse({ ...validTrail, contributors: [""] }).success,
    ).toBe(false);
  });
});

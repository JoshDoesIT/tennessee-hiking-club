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
});

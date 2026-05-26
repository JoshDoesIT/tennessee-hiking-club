import { describe, it, expect } from "vitest";
import { trailMetadata } from "./metadata";
import type { Trail } from "./schema";

const trail: Trail = {
  slug: "mt-x",
  name: "Mount X",
  region: "East",
  area: "Great Smoky Mountains",
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 11,
  elevationGainFt: 2000,
  difficulty: "strenuous",
  routeType: "out-and-back",
  tags: [],
  photos: [{ src: "/trails/placeholder.png", alt: "Ridge at golden hour" }],
  summary: "A classic climb.",
  body: "",
};

describe("trailMetadata", () => {
  it("uses the trail name and summary for title and description", () => {
    const m = trailMetadata(trail);
    expect(m.title).toBe("Mount X");
    expect(m.description).toBe("A classic climb.");
  });

  it("includes Open Graph and Twitter cards with the trail photo", () => {
    const og = trailMetadata(trail).openGraph as Record<string, unknown>;
    expect(og.title).toBe("Mount X");
    expect(og.type).toBe("article");
    expect(JSON.stringify(og.images)).toContain("/trails/placeholder.png");

    const tw = trailMetadata(trail).twitter as Record<string, unknown>;
    expect(tw.card).toBe("summary_large_image");
  });

  it("omits images when the trail has no photos", () => {
    const og = trailMetadata({ ...trail, photos: [] }).openGraph as Record<
      string,
      unknown
    >;
    expect(og.images).toBeUndefined();
  });
});

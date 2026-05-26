import { describe, it, expect } from "vitest";
import { trailMetadata, trailJsonLd } from "./metadata";
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

  it("includes Open Graph (article) and a Twitter summary card", () => {
    const og = trailMetadata(trail).openGraph as Record<string, unknown>;
    expect(og.title).toBe("Mount X");
    expect(og.type).toBe("article");

    const tw = trailMetadata(trail).twitter as Record<string, unknown>;
    expect(tw.card).toBe("summary_large_image");
  });

  it("sets a canonical URL for the trail", () => {
    expect(trailMetadata(trail).alternates?.canonical).toBe("/trails/mt-x");
  });
});

describe("trailJsonLd", () => {
  it("produces schema.org structured data with geo coordinates", () => {
    const ld = trailJsonLd(trail) as Record<string, unknown>;
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("TouristAttraction");
    expect(ld.name).toBe("Mount X");
    expect(ld.geo).toMatchObject({
      "@type": "GeoCoordinates",
      latitude: 35.6,
      longitude: -83.4,
    });
  });
});

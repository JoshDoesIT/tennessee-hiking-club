import { describe, it, expect } from "vitest";
import { routeLineFeature, routeLinesCollection } from "./route-line";

describe("routeLineFeature", () => {
  it("returns null for a missing or too-short route", () => {
    expect(routeLineFeature()).toBeNull();
    expect(routeLineFeature([])).toBeNull();
    expect(routeLineFeature([{ lat: 36, lng: -82 }])).toBeNull();
  });

  it("builds a LineString of [lng, lat] pairs", () => {
    const f = routeLineFeature([
      { lat: 36.1, lng: -82.1 },
      { lat: 36.2, lng: -82.0 },
    ]);
    expect(f?.geometry.type).toBe("LineString");
    expect(f?.geometry.coordinates).toEqual([
      [-82.1, 36.1],
      [-82.0, 36.2],
    ]);
  });
});

describe("routeLinesCollection", () => {
  it("collects only trails with a drawable route, tagged by slug", () => {
    const c = routeLinesCollection([
      {
        slug: "a",
        route: [
          { lat: 36.1, lng: -82.1 },
          { lat: 36.2, lng: -82.0 },
        ],
      },
      { slug: "b", route: [{ lat: 36, lng: -82 }] }, // too short, skipped
      { slug: "c" }, // no route, skipped
    ]);
    expect(c.type).toBe("FeatureCollection");
    expect(c.features).toHaveLength(1);
    expect(c.features[0].properties.slug).toBe("a");
  });

  it("returns an empty collection for no trails", () => {
    expect(routeLinesCollection([]).features).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import {
  pointToSegmentMeters,
  pointToPolylineMeters,
  gnisWaypoints,
  npsPoiWaypoints,
  osmWaypoints,
  filterNearRoute,
  dedupeWaypoints,
  orderAlongRoute,
  attributionFor,
  candidateWaypointsYaml,
} from "./waypoint-discovery";

// A short east-west route near the Smokies for distance/order tests.
const route = [
  { lat: 35.0, lng: -85.0 },
  { lat: 35.0, lng: -84.99 },
  { lat: 35.0, lng: -84.98 },
];

describe("pointToSegmentMeters / pointToPolylineMeters", () => {
  it("is ~0 for a point on the line", () => {
    const p = { lat: 35.0, lng: -84.995 }; // midpoint of first segment
    expect(pointToPolylineMeters(p, route)).toBeLessThan(2);
  });

  it("measures perpendicular distance for an off-line point", () => {
    // 0.001 deg north of the route start ~= 111 m.
    const p = { lat: 35.001, lng: -85.0 };
    const a = { lat: 35.0, lng: -85.0 };
    const b = { lat: 35.0, lng: -84.99 };
    const d = pointToSegmentMeters(p, a, b);
    expect(d).toBeGreaterThan(108);
    expect(d).toBeLessThan(114);
  });

  it("clamps to the nearest endpoint when the point is past the segment", () => {
    // East of segment end b: closest point is b, ~0.01 deg lng east of b.
    const p = { lat: 35.0, lng: -84.98 };
    const a = { lat: 35.0, lng: -85.0 };
    const b = { lat: 35.0, lng: -84.99 };
    const d = pointToSegmentMeters(p, a, b);
    expect(d).toBeGreaterThan(890);
    expect(d).toBeLessThan(935);
  });
});

describe("source parsers", () => {
  it("gnisWaypoints maps gazetteer features to typed candidates", () => {
    const sample = {
      features: [
        {
          attributes: { gaz_name: "Rainbow Falls", gaz_featureclass: "Falls" },
          geometry: { points: [[-83.45, 35.7]] },
        },
        {
          attributes: { gaz_name: "Newfound Gap", gaz_featureclass: "Gap" },
          geometry: { points: [[-83.42, 35.61]] },
        },
        // No geometry -> skipped.
        {
          attributes: { gaz_name: "Nowhere", gaz_featureclass: "Summit" },
        },
      ],
    };
    const out = gnisWaypoints(sample);
    expect(out).toEqual([
      { lat: 35.7, lng: -83.45, name: "Rainbow Falls", type: "waterfall", source: "gnis" },
      { lat: 35.61, lng: -83.42, name: "Newfound Gap", type: "gap", source: "gnis" },
    ]);
  });

  it("npsPoiWaypoints maps a GeoJSON FeatureCollection to candidates", () => {
    const fc = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { POINAME: "Grotto Falls", POITYPE: "Waterfall" },
          geometry: { type: "Point", coordinates: [-83.48, 35.68] },
        },
        {
          type: "Feature",
          properties: { POINAME: "Myrtle Point", POITYPE: "Scenic View" },
          geometry: { type: "Point", coordinates: [-83.43, 35.65] },
        },
      ],
    };
    const out = npsPoiWaypoints(fc);
    expect(out).toEqual([
      { lat: 35.68, lng: -83.48, name: "Grotto Falls", type: "waterfall", source: "nps" },
      { lat: 35.65, lng: -83.43, name: "Myrtle Point", type: "viewpoint", source: "nps" },
    ]);
  });

  it("osmWaypoints maps Overpass elements and drops unnamed features", () => {
    const json = {
      elements: [
        { type: "node", lat: 35.66, lon: -83.44, tags: { natural: "peak", name: "Cliff Top" } },
        { type: "node", lat: 35.67, lon: -83.46, tags: { waterway: "waterfall", name: "Alum Cave Falls" } },
        { type: "node", lat: 35.6, lon: -83.4, tags: { natural: "peak" } }, // unnamed
        { type: "way", center: { lat: 35.65, lon: -83.43 }, tags: { tourism: "viewpoint", name: "The Overlook" } },
      ],
    };
    const out = osmWaypoints(json);
    expect(out).toEqual([
      { lat: 35.66, lng: -83.44, name: "Cliff Top", type: "summit", source: "osm" },
      { lat: 35.67, lng: -83.46, name: "Alum Cave Falls", type: "waterfall", source: "osm" },
      { lat: 35.65, lng: -83.43, name: "The Overlook", type: "viewpoint", source: "osm" },
    ]);
  });
});

describe("filterNearRoute", () => {
  it("keeps features within the buffer and drops the rest", () => {
    const near = { lat: 35.0005, lng: -84.99, name: "Near", type: "viewpoint" as const, source: "osm" as const };
    const far = { lat: 36.0, lng: -84.99, name: "Far", type: "viewpoint" as const, source: "osm" as const };
    const out = filterNearRoute([near, far], route, 150);
    expect(out.map((c) => c.name)).toEqual(["Near"]);
  });
});

describe("dedupeWaypoints", () => {
  it("merges same-name candidates, preferring the higher-priority source", () => {
    const out = dedupeWaypoints([
      { lat: 35.7, lng: -83.45, name: "Rainbow Falls", type: "waterfall", source: "osm" },
      { lat: 35.7001, lng: -83.4501, name: "Rainbow Falls", type: "waterfall", source: "gnis" },
      { lat: 35.61, lng: -83.42, name: "Newfound Gap", type: "gap", source: "gnis" },
    ]);
    expect(out).toHaveLength(2);
    const rainbow = out.find((c) => c.name === "Rainbow Falls");
    expect(rainbow?.source).toBe("gnis");
  });

  it("merges near-coincident same-type candidates with different spellings", () => {
    const out = dedupeWaypoints([
      { lat: 35.6544, lng: -83.4367, name: "Mount LeConte", type: "summit", source: "gnis" },
      { lat: 35.6545, lng: -83.4368, name: "Mt LeConte", type: "summit", source: "osm" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("gnis");
  });
});

describe("orderAlongRoute", () => {
  it("orders candidates by position along the route", () => {
    const west = { lat: 35.0005, lng: -84.999, name: "West", type: "viewpoint" as const, source: "osm" as const };
    const east = { lat: 35.0005, lng: -84.981, name: "East", type: "viewpoint" as const, source: "osm" as const };
    const out = orderAlongRoute([east, west], route);
    expect(out.map((c) => c.name)).toEqual(["West", "East"]);
  });
});

describe("attributionFor", () => {
  it("returns the attribution lines for the sources present", () => {
    const lines = attributionFor([
      { lat: 1, lng: 1, name: "a", type: "waterfall", source: "gnis" },
      { lat: 1, lng: 1, name: "b", type: "summit", source: "osm" },
    ]);
    expect(lines.some((l) => /GNIS/.test(l))).toBe(true);
    expect(lines.some((l) => /OpenStreetMap/.test(l))).toBe(true);
    // No NPS candidate -> no NPS line.
    expect(lines.some((l) => /NPS/.test(l))).toBe(false);
  });
});

describe("candidateWaypointsYaml", () => {
  it("prints a schema-shaped waypoints block", () => {
    const yaml = candidateWaypointsYaml([
      { lat: 35.7, lng: -83.45, name: "Rainbow Falls", type: "waterfall", source: "gnis" },
    ]);
    expect(yaml).toContain("waypoints:");
    expect(yaml).toContain("name: Rainbow Falls");
    expect(yaml).toContain("type: waterfall");
    expect(yaml).toContain("lat: 35.7");
    expect(yaml).toContain("lng: -83.45");
  });
});

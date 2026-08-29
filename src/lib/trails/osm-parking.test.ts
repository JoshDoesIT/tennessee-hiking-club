import { describe, it, expect } from "vitest";
import {
  overpassParkingQuery,
  selectNearestParking,
  resolveParking,
  type OverpassElement,
} from "./osm-parking";
import type { Trail } from "./schema";

const trailhead = { lat: 35.7277, lng: -84.8556 };

// A fixture Overpass response: a node a bit away, a way (with center) closest,
// and a far node beyond the radius.
const elements: OverpassElement[] = [
  { type: "node", lat: 35.7305, lon: -84.857, tags: { amenity: "parking" } },
  {
    type: "way",
    center: { lat: 35.7281, lon: -84.8559 },
    tags: { amenity: "parking", name: "Falls Trailhead Lot" },
  },
  { type: "node", lat: 35.9, lon: -85.1, tags: { amenity: "parking" } },
];

describe("overpassParkingQuery", () => {
  it("asks for amenity=parking around the trailhead and returns centers", () => {
    const q = overpassParkingQuery(trailhead, 1200);
    expect(q).toContain('"amenity"="parking"');
    expect(q).toContain("around:1200,35.7277,-84.8556");
    expect(q).toContain("out center");
  });
});

describe("selectNearestParking", () => {
  it("picks the nearest lot within range and keeps its name", () => {
    const result = selectNearestParking(elements, trailhead, 2);
    expect(result).toMatchObject({
      lat: 35.7281,
      lng: -84.8559,
      name: "Falls Trailhead Lot",
    });
  });

  it("returns null when nothing is within range", () => {
    const far = [
      { type: "node", lat: 36.5, lon: -86, tags: { amenity: "parking" } },
    ];
    expect(selectNearestParking(far, trailhead, 2)).toBeNull();
  });

  it("returns null for an empty response", () => {
    expect(selectNearestParking([], trailhead, 2)).toBeNull();
  });
});

const makeTrail = (over: Partial<Trail>): Trail =>
  ({
    slug: "piney-falls",
    name: "Piney Falls",
    region: "East",
    area: "A",
    coordinates: trailhead,
    lengthMiles: 2,
    elevationGainFt: 300,
    difficulty: "moderate",
    routeType: "loop",
    tags: [],
    photos: [],
    summary: "s",
    body: "",
    alerts: [],
    conditionReports: [],
    ...over,
  }) as Trail;

describe("resolveParking", () => {
  it("prefers declared content parking over OSM", () => {
    const trail = makeTrail({
      parking: { lat: 35.73, lng: -84.85, note: "Gravel lot" },
    });
    const resolved = resolveParking(trail, {
      "piney-falls": { lat: 1, lng: 2 },
    });
    expect(resolved).toMatchObject({
      source: "content",
      parking: { note: "Gravel lot" },
    });
  });

  it("falls back to OSM parking when none is declared", () => {
    const resolved = resolveParking(makeTrail({}), {
      "piney-falls": { lat: 35.7281, lng: -84.8559, name: "Lot" },
    });
    expect(resolved).toMatchObject({
      source: "osm",
      parking: { lat: 35.7281, lng: -84.8559 },
    });
  });

  it("is null when there is neither declared nor OSM parking", () => {
    expect(resolveParking(makeTrail({}), {})).toBeNull();
  });
});

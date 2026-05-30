import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import {
  metersToFeet,
  parseGpxTrack,
  downsampleRoute,
  routeFrontmatterYaml,
} from "./route-import";
import type { RoutePoint } from "./elevation";

describe("metersToFeet", () => {
  it("converts and rounds", () => {
    expect(metersToFeet(1219.2)).toBe(4000);
    expect(metersToFeet(0)).toBe(0);
  });
});

const gpx = `<?xml version="1.0"?>
<gpx version="1.1"><trk><name>Sample Trail</name><trkseg>
  <trkpt lat="35.6000" lon="-83.4500"><ele>1219.2</ele></trkpt>
  <trkpt lat="35.6010" lon="-83.4490"><ele>1280.0</ele></trkpt>
  <trkpt lat="35.6020" lon="-83.4480"></trkpt>
  <trkpt lat="35.6030" lon="-83.4470"><ele>1250.0</ele></trkpt>
</trkseg></trk></gpx>`;

describe("parseGpxTrack", () => {
  it("extracts the name and elevation-bearing points (m -> ft)", () => {
    const track = parseGpxTrack(gpx);
    expect(track.name).toBe("Sample Trail");
    // The point with no <ele> is skipped.
    expect(track.points).toHaveLength(3);
    expect(track.points[0]).toEqual({ lat: 35.6, lng: -83.45, elevationFt: 4000 });
  });
});

describe("downsampleRoute", () => {
  const pts: RoutePoint[] = Array.from({ length: 10 }, (_, i) => ({
    lat: 35 + i * 0.01,
    lng: -83,
    elevationFt: 1000 + i,
  }));

  it("keeps endpoints and reduces to the cap", () => {
    const out = downsampleRoute(pts, 3);
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual(pts[0]);
    expect(out[2]).toEqual(pts[9]);
  });

  it("returns the input unchanged when already small enough", () => {
    expect(downsampleRoute(pts, 20)).toHaveLength(10);
  });
});

describe("routeFrontmatterYaml", () => {
  it("emits a route block that round-trips to numbers", () => {
    const route: RoutePoint[] = [
      { lat: 35.6, lng: -83.45, elevationFt: 4000 },
      { lat: 35.61, lng: -83.44, elevationFt: 4200 },
    ];
    const doc = matter(`---\n${routeFrontmatterYaml(route)}\n---\n`);
    expect(doc.data.route).toEqual(route);
  });
});

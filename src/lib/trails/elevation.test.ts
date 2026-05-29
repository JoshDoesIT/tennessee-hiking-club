import { describe, it, expect } from "vitest";
import {
  haversineMiles,
  buildElevationProfile,
  routeToGpx,
  type RoutePoint,
} from "./elevation";

describe("haversineMiles", () => {
  it("is zero for the same point", () => {
    expect(haversineMiles({ lat: 35, lng: -84 }, { lat: 35, lng: -84 })).toBe(0);
  });

  it("is about 69 miles for one degree of latitude", () => {
    const d = haversineMiles({ lat: 35, lng: -84 }, { lat: 36, lng: -84 });
    expect(d).toBeGreaterThan(68);
    expect(d).toBeLessThan(70);
  });
});

const route: RoutePoint[] = [
  { lat: 35.6, lng: -83.45, elevationFt: 4000 },
  { lat: 35.62, lng: -83.44, elevationFt: 4600 },
  { lat: 35.64, lng: -83.43, elevationFt: 4400 },
  { lat: 35.66, lng: -83.42, elevationFt: 6593 },
];

describe("buildElevationProfile", () => {
  it("produces cumulative distance starting at zero and rising elevations", () => {
    const profile = buildElevationProfile(route);
    expect(profile.points).toHaveLength(4);
    expect(profile.points[0].distanceMi).toBe(0);
    expect(profile.points[3].distanceMi).toBeGreaterThan(
      profile.points[1].distanceMi,
    );
    expect(profile.points[0].elevationFt).toBe(4000);
  });

  it("summarizes total distance, gain, high and low", () => {
    const profile = buildElevationProfile(route);
    expect(profile.totalMiles).toBeGreaterThan(0);
    expect(profile.highFt).toBe(6593);
    expect(profile.lowFt).toBe(4000);
    // Gains: 600 (4000->4600) + 2193 (4400->6593) = 2793; the dip is not gain.
    expect(profile.gainFt).toBe(2793);
  });
});

describe("routeToGpx", () => {
  it("emits a GPX track with elevation-tagged points", () => {
    const gpx = routeToGpx("Mount LeConte", route);
    expect(gpx).toContain("<gpx");
    expect(gpx).toContain("<trk>");
    expect(gpx).toContain("<name>Mount LeConte</name>");
    expect(gpx).toContain('<trkpt lat="35.6" lon="-83.45">');
    expect(gpx).toContain("<ele>4000</ele>");
    expect((gpx.match(/<trkpt/g) ?? []).length).toBe(4);
  });

  it("escapes XML in the track name", () => {
    expect(routeToGpx("Rock & Roll", route)).toContain(
      "<name>Rock &amp; Roll</name>",
    );
  });
});

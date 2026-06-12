import { describe, it, expect } from "vitest";
import { prepareRouteSubmission } from "./route";

const gpx = (pts: string) =>
  `<?xml version="1.0"?>\n<gpx version="1.1"><trk><name>Morning hike</name><trkseg>${pts}</trkseg></trk></gpx>`;

describe("prepareRouteSubmission", () => {
  it("parses a GPX track into a route with length and gain", () => {
    const r = prepareRouteSubmission(
      gpx(
        `<trkpt lat="35.60" lon="-83.45"><ele>1000</ele></trkpt>` +
          `<trkpt lat="35.62" lon="-83.44"><ele>1200</ele></trkpt>`,
      ),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.route).toHaveLength(2);
      expect(r.route[0]).toMatchObject({ lat: 35.6, lng: -83.45 });
      expect(typeof r.route[0].elevationFt).toBe("number");
      expect(r.name).toBe("Morning hike");
      expect(r.lengthMiles).toBeGreaterThan(0);
      expect(r.gainFt).toBeGreaterThan(0);
      expect(r.pointCount).toBe(2);
    }
  });

  it("downsamples a long track to the point cap", () => {
    const many = Array.from(
      { length: 500 },
      (_, i) => `<trkpt lat="${35.6 + i * 0.0001}" lon="-83.45"><ele>${1000 + i}</ele></trkpt>`,
    ).join("");
    const r = prepareRouteSubmission(gpx(many), 70);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.route.length).toBeLessThanOrEqual(70);
      expect(r.pointCount).toBe(500); // original count preserved
    }
  });

  it("rejects a GPX with no usable track points", () => {
    expect(prepareRouteSubmission("<gpx></gpx>").ok).toBe(false);
    expect(
      prepareRouteSubmission(gpx(`<trkpt lat="35.6" lon="-83.45"><ele>1000</ele></trkpt>`)).ok,
    ).toBe(false); // a single point is not a route
  });

  it("rejects a track whose start is outside Tennessee", () => {
    const r = prepareRouteSubmission(
      gpx(
        `<trkpt lat="40.0" lon="-100.0"><ele>500</ele></trkpt>` +
          `<trkpt lat="40.1" lon="-100.1"><ele>600</ele></trkpt>`,
      ),
    );
    expect(r.ok).toBe(false);
  });
});

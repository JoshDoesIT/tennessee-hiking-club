import { describe, it, expect } from "vitest";
import { gpxTrackSummary, positionToPoint } from "./track";

const gpx = (pts: string) =>
  `<?xml version="1.0"?>\n<gpx version="1.1"><trk><name>Morning loop</name><trkseg>${pts}</trkseg></trk></gpx>`;

describe("gpxTrackSummary", () => {
  it("summarises a GPX track into points, length, and gain", () => {
    const t = gpxTrackSummary(
      gpx(
        `<trkpt lat="35.60" lon="-83.45"><ele>1000</ele></trkpt>` +
          `<trkpt lat="35.62" lon="-83.44"><ele>1200</ele></trkpt>`,
      ),
    );
    expect(t).not.toBeNull();
    expect(t!.points).toHaveLength(2);
    expect(t!.points[0]).toMatchObject({ lat: 35.6, lng: -83.45 });
    expect(t!.lengthMiles).toBeGreaterThan(0);
    expect(t!.gainFt).toBeGreaterThan(0);
  });

  it("derives duration in minutes from trackpoint times", () => {
    const t = gpxTrackSummary(
      gpx(
        `<trkpt lat="35.60" lon="-83.45"><ele>1000</ele><time>2026-05-30T08:00:00Z</time></trkpt>` +
          `<trkpt lat="35.62" lon="-83.44"><ele>1200</ele><time>2026-05-30T09:30:00Z</time></trkpt>`,
      ),
    );
    expect(t!.durationMin).toBe(90);
  });

  it("ignores a metadata time and leaves duration undefined without trackpoint times", () => {
    const t = gpxTrackSummary(
      `<gpx><metadata><time>2026-05-30T07:00:00Z</time></metadata><trk><trkseg>` +
        `<trkpt lat="35.60" lon="-83.45"><ele>1000</ele></trkpt>` +
        `<trkpt lat="35.62" lon="-83.44"><ele>1200</ele></trkpt>` +
        `</trkseg></trk></gpx>`,
    );
    expect(t!.durationMin).toBeUndefined();
  });

  it("downsamples a long track to the point cap", () => {
    const many = Array.from(
      { length: 400 },
      (_, i) => `<trkpt lat="${35.6 + i * 0.0001}" lon="-83.45"><ele>${1000 + i}</ele></trkpt>`,
    ).join("");
    const t = gpxTrackSummary(gpx(many), 70);
    expect(t!.points.length).toBeLessThanOrEqual(70);
  });

  it("returns null for a GPX with fewer than two usable points", () => {
    expect(gpxTrackSummary("<gpx></gpx>")).toBeNull();
    expect(
      gpxTrackSummary(gpx(`<trkpt lat="35.6" lon="-83.45"><ele>1000</ele></trkpt>`)),
    ).toBeNull();
  });
});

describe("positionToPoint", () => {
  it("maps geolocation coords to a route point, altitude in feet", () => {
    expect(
      positionToPoint({ latitude: 35.6, longitude: -83.45, altitude: 1000 }),
    ).toEqual({ lat: 35.6, lng: -83.45, elevationFt: 3281 });
  });

  it("uses zero elevation when altitude is unavailable", () => {
    expect(
      positionToPoint({ latitude: 35.6, longitude: -83.45, altitude: null }),
    ).toEqual({ lat: 35.6, lng: -83.45, elevationFt: 0 });
  });
});

import { describe, it, expect } from "vitest";
import {
  currentPosition,
  bearingBetween,
  travelHeading,
  boundsOf,
} from "./recording-map";

const pt = (lat: number, lng: number) => ({ lat, lng });

describe("currentPosition", () => {
  it("falls back to the given center before any fix has been recorded", () => {
    expect(currentPosition([], { lat: 35.6, lng: -83.4 })).toEqual([
      -83.4, 35.6,
    ]);
  });

  it("follows the most recent recorded fix as [lng, lat]", () => {
    const points = [
      { lat: 35.6, lng: -83.4 },
      { lat: 35.61, lng: -83.41 },
      { lat: 35.62, lng: -83.42 },
    ];
    expect(currentPosition(points, { lat: 0, lng: 0 })).toEqual([
      -83.42, 35.62,
    ]);
  });
});

describe("bearingBetween", () => {
  it("reads 0 deg due north, 90 east, 180 south, 270 west", () => {
    expect(bearingBetween(pt(0, 0), pt(1, 0))).toBeCloseTo(0, 1);
    expect(bearingBetween(pt(0, 0), pt(0, 1))).toBeCloseTo(90, 1);
    expect(bearingBetween(pt(1, 0), pt(0, 0))).toBeCloseTo(180, 1);
    expect(bearingBetween(pt(0, 0), pt(0, -1))).toBeCloseTo(270, 1);
  });
});

describe("travelHeading", () => {
  it("returns null until there is real movement to take a heading from", () => {
    expect(travelHeading([])).toBeNull();
    expect(travelHeading([pt(35.6, -83.4)])).toBeNull();
  });

  it("ignores tiny GPS jitter so the map doesn't spin while standing still", () => {
    // ~0.5 m apart: below the movement threshold.
    const points = [pt(35.6, -83.4), pt(35.600004, -83.4)];
    expect(travelHeading(points)).toBeNull();
  });

  it("takes the heading from the most recent real movement", () => {
    // Walking east; the last fix is jitter near the prior one.
    const points = [
      pt(35.6, -83.4),
      pt(35.6, -83.39),
      pt(35.600002, -83.39),
    ];
    const h = travelHeading(points);
    expect(h).not.toBeNull();
    expect(h as number).toBeCloseTo(90, 0);
  });
});

describe("boundsOf", () => {
  it("returns null with nothing to frame", () => {
    expect(boundsOf([])).toBeNull();
  });

  it("returns the [[w,s],[e,n]] envelope of the coordinates", () => {
    const bounds = boundsOf([
      pt(35.6, -83.5),
      pt(35.7, -83.4),
      pt(35.55, -83.45),
    ]);
    expect(bounds).toEqual([
      [-83.5, 35.55],
      [-83.4, 35.7],
    ]);
  });
});

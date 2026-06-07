import { describe, it, expect } from "vitest";
import { currentPosition } from "./recording-map";

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

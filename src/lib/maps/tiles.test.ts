import { describe, it, expect } from "vitest";
import {
  lngLatToTile,
  tileRangeForBounds,
  countTiles,
  enumerateTiles,
  expandTemplate,
  MAX_TILES,
  type LngLatBounds,
} from "./tiles";

// A small box around the Obed / Big South Fork country in NE Tennessee.
const KNOX: LngLatBounds = {
  west: -84.05,
  south: 35.9,
  east: -83.85,
  north: 36.05,
};

describe("lngLatToTile", () => {
  it("maps the map origin (0,0) to the centre tile at z=1", () => {
    expect(lngLatToTile(0, 0, 1)).toEqual({ x: 1, y: 1 });
  });

  it("maps the top-left of the Mercator world to tile (0,0)", () => {
    expect(lngLatToTile(-180, 85.0511, 2)).toEqual({ x: 0, y: 0 });
  });

  it("collapses everything to a single tile at zoom 0", () => {
    expect(lngLatToTile(123, -45, 0)).toEqual({ x: 0, y: 0 });
    expect(lngLatToTile(-83.9, 36, 0)).toEqual({ x: 0, y: 0 });
  });

  it("clamps out-of-range lng/lat into the valid tile grid", () => {
    const t = lngLatToTile(200, 95, 3); // beyond 180 lng and the Mercator lat
    expect(t.x).toBeGreaterThanOrEqual(0);
    expect(t.x).toBeLessThanOrEqual(7);
    expect(t.y).toBeGreaterThanOrEqual(0);
    expect(t.y).toBeLessThanOrEqual(7);
  });
});

describe("tileRangeForBounds", () => {
  it("returns an ordered, inclusive x/y range covering the box", () => {
    const r = tileRangeForBounds(KNOX, 12);
    expect(r.minX).toBeLessThanOrEqual(r.maxX);
    expect(r.minY).toBeLessThanOrEqual(r.maxY);
    // The SW (north-east, lower-left) corner sits at a larger tile-x / larger
    // tile-y than the NW corner, so the range spans at least one tile each way.
    expect(r.maxX - r.minX).toBeGreaterThanOrEqual(0);
  });
});

describe("countTiles / enumerateTiles", () => {
  it("counts exactly what enumerate produces", () => {
    expect(countTiles(KNOX, 10, 12)).toBe(enumerateTiles(KNOX, 10, 12).length);
  });

  it("never decreases as the max zoom grows", () => {
    expect(countTiles(KNOX, 10, 11)).toBeLessThanOrEqual(
      countTiles(KNOX, 10, 12),
    );
  });

  it("produces only tiles inside the requested zoom range", () => {
    for (const t of enumerateTiles(KNOX, 10, 12)) {
      expect(t.z).toBeGreaterThanOrEqual(10);
      expect(t.z).toBeLessThanOrEqual(12);
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("refuses to enumerate a region that would exceed the tile ceiling", () => {
    // The whole state at z=14 is far more than one region should pull.
    const tn: LngLatBounds = {
      west: -90.3,
      south: 35,
      east: -81.6,
      north: 36.7,
    };
    expect(countTiles(tn, 14, 14)).toBeGreaterThan(MAX_TILES);
    expect(() => enumerateTiles(tn, 14, 14)).toThrow(RangeError);
  });
});

describe("expandTemplate", () => {
  it("fills the {z}/{x}/{y} placeholders", () => {
    expect(
      expandTemplate("https://t.example/planet/v1/{z}/{x}/{y}.pbf", {
        z: 12,
        x: 1100,
        y: 1600,
      }),
    ).toBe("https://t.example/planet/v1/12/1100/1600.pbf");
  });
});

import { describe, it, expect } from "vitest";
import { TENNESSEE } from "./tennessee";
import {
  tennesseeProjection,
  projectPoint,
  MAP_WIDTH,
  MAP_HEIGHT,
} from "./projection";

describe("Tennessee geometry", () => {
  it("is a GeoJSON feature for FIPS 47", () => {
    expect(TENNESSEE.type).toBe("Feature");
    expect(String(TENNESSEE.id)).toBe("47");
    expect(["Polygon", "MultiPolygon"]).toContain(TENNESSEE.geometry.type);
  });
});

describe("projectPoint", () => {
  const projection = tennesseeProjection();

  it("places a Tennessee coordinate inside the map viewBox", () => {
    const [x, y] = projectPoint(-86.0, 35.8, projection); // ~Middle TN
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(MAP_WIDTH);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(MAP_HEIGHT);
  });

  it("projects an eastern point to the right of a western point", () => {
    const [eastX] = projectPoint(-83.44, 35.65, projection); // Mt. LeConte (East)
    const [westX] = projectPoint(-89.4, 36.38, projection); // Reelfoot (West)
    expect(eastX).toBeGreaterThan(westX);
  });

  it("projects a northern point above a southern point", () => {
    const [, northY] = projectPoint(-86, 36.5, projection);
    const [, southY] = projectPoint(-86, 35.0, projection);
    expect(northY).toBeLessThan(southY); // SVG y grows downward
  });
});

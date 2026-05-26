import { describe, it, expect } from "vitest";
import { tennesseeMapData } from "./map-data";
import { getAllTrails } from "@/lib/trails";

describe("tennesseeMapData", () => {
  const trails = getAllTrails();
  const data = tennesseeMapData(trails);

  it("returns a non-empty SVG outline path", () => {
    expect(data.outline.length).toBeGreaterThan(0);
    expect(data.outline.startsWith("M")).toBe(true);
  });

  it("returns one pin per trail with percentage coordinates inside the viewBox", () => {
    expect(data.pins).toHaveLength(trails.length);
    for (const pin of data.pins) {
      expect(pin.xPct).toBeGreaterThanOrEqual(0);
      expect(pin.xPct).toBeLessThanOrEqual(100);
      expect(pin.yPct).toBeGreaterThanOrEqual(0);
      expect(pin.yPct).toBeLessThanOrEqual(100);
    }
  });

  it("carries the slug, name, and region for each pin", () => {
    const first = data.pins.find((p) => p.slug === trails[0].slug);
    expect(first).toMatchObject({
      name: trails[0].name,
      region: trails[0].region,
    });
  });
});

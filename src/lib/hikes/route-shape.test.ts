import { describe, it, expect } from "vitest";
import { routeShapePath } from "./route-shape";

const pts = (arr: [number, number][]) =>
  arr.map(([lat, lng]) => ({ lat, lng }));

describe("routeShapePath", () => {
  it("returns an empty string for fewer than two points", () => {
    expect(routeShapePath([], 100, 100)).toBe("");
    expect(routeShapePath(pts([[36, -82]]), 100, 100)).toBe("");
  });

  it("returns an empty string when the track has no real movement", () => {
    const stationary = pts([
      [36.1, -82.1],
      [36.1, -82.1],
      [36.1, -82.1],
    ]);
    expect(routeShapePath(stationary, 100, 100)).toBe("");
  });

  it("keeps every projected point inside the padded box", () => {
    const path = routeShapePath(
      pts([
        [36.1, -82.1],
        [36.11, -82.08],
        [36.105, -82.06],
        [36.12, -82.05],
      ]),
      100,
      60,
      4,
    );
    const coords = path.split(" ").map((s) => s.split(",").map(Number));
    expect(coords).toHaveLength(4);
    for (const [x, y] of coords) {
      expect(x).toBeGreaterThanOrEqual(4);
      expect(x).toBeLessThanOrEqual(96);
      expect(y).toBeGreaterThanOrEqual(4);
      expect(y).toBeLessThanOrEqual(56);
    }
  });

  it("preserves aspect ratio: an east-west track is wider than tall", () => {
    const path = routeShapePath(
      pts([
        [36.1, -82.2],
        [36.1005, -82.1],
        [36.1, -82.0],
      ]),
      100,
      100,
    );
    const coords = path.split(" ").map((s) => s.split(",").map(Number));
    const xs = coords.map((c) => c[0]);
    const ys = coords.map((c) => c[1]);
    const xSpan = Math.max(...xs) - Math.min(...xs);
    const ySpan = Math.max(...ys) - Math.min(...ys);
    expect(xSpan).toBeGreaterThan(ySpan);
  });

  it("puts the northernmost point highest (smallest y)", () => {
    const path = routeShapePath(
      pts([
        [36.1, -82.1],
        [36.12, -82.1001],
      ]),
      100,
      100,
      0,
    );
    const [p0, p1] = path.split(" ").map((s) => s.split(",").map(Number));
    // p1 is further north (higher lat), so it should sit higher up (smaller y).
    expect(p1[1]).toBeLessThan(p0[1]);
  });
});

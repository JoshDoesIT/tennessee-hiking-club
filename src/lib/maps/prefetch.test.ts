import { describe, it, expect, vi } from "vitest";
import { trailBounds, prefetchAllTrailAreas } from "./prefetch";

vi.mock("./tile-sources", () => ({
  resolveTileSources: vi.fn(async () => [
    { template: "https://t/planet/v/{z}/{x}/{y}.pbf", maxzoom: 14 },
  ]),
}));

const centers = [
  { lat: 35.96, lng: -83.92 },
  { lat: 36.12, lng: -84.21 },
];

describe("trailBounds", () => {
  it("makes a small symmetric box around the trailhead", () => {
    const b = trailBounds(centers[0]);
    expect(b.west).toBeLessThan(centers[0].lng);
    expect(b.east).toBeGreaterThan(centers[0].lng);
    expect((b.west + b.east) / 2).toBeCloseTo(centers[0].lng);
    expect((b.south + b.north) / 2).toBeCloseTo(centers[0].lat);
  });
});

describe("prefetchAllTrailAreas", () => {
  it("does nothing and fetches nothing when offline", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response);
    const result = await prefetchAllTrailAreas(centers, {
      fetchImpl,
      isOnline: () => false,
    });
    expect(result).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches tiles for every trail area when online", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response);
    const result = await prefetchAllTrailAreas(centers, {
      fetchImpl,
      isOnline: () => true,
    });
    expect(result).not.toBeNull();
    expect(result!.trails).toBe(2);
    expect(result!.ok).toBeGreaterThan(0);
    expect(fetchImpl).toHaveBeenCalled();
    expect(
      String((fetchImpl.mock.calls[0] as unknown as [string])[0]),
    ).toContain("/planet/v/");
  });

  it("stops early when aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response);
    const result = await prefetchAllTrailAreas(centers, {
      fetchImpl,
      isOnline: () => true,
      signal: controller.signal,
    });
    expect(result!.trails).toBe(0);
  });
});

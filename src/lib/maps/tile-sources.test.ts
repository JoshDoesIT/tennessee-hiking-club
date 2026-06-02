import { describe, it, expect, vi } from "vitest";
import { resolveTileSources, TERRARIUM_DEM_TEMPLATE } from "./tile-sources";

describe("resolveTileSources", () => {
  it("puts the live vector template first, then the elevation DEM", async () => {
    const template = "https://tiles.openfreemap.org/planet/20260520_x/{z}/{x}/{y}.pbf";
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ tiles: [template], minzoom: 0, maxzoom: 14 }),
    })) as unknown as typeof fetch;

    const sources = await resolveTileSources(fetchImpl);
    expect(sources[0].template).toBe(template);
    expect(sources[0].maxzoom).toBe(14);
    expect(sources.some((s) => s.template === TERRARIUM_DEM_TEMPLATE)).toBe(true);
  });

  it("falls back to the DEM alone when the TileJSON cannot be read", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;

    const sources = await resolveTileSources(fetchImpl);
    expect(sources).toHaveLength(1);
    expect(sources[0].template).toBe(TERRARIUM_DEM_TEMPLATE);
  });

  it("falls back to the DEM alone on a non-ok response", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false })) as unknown as typeof fetch;
    const sources = await resolveTileSources(fetchImpl);
    expect(sources.map((s) => s.template)).toEqual([TERRARIUM_DEM_TEMPLATE]);
  });
});

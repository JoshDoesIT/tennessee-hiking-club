import { describe, it, expect, vi } from "vitest";
import { downloadTiles, regionTileUrls } from "./download-region";
import { countTiles, type LngLatBounds } from "./tiles";

const okFetch = () =>
  vi.fn(async () => ({ ok: true }) as unknown as Response);

const BOX: LngLatBounds = {
  west: -84.05,
  south: 35.9,
  east: -83.95,
  north: 36.0,
};

describe("downloadTiles", () => {
  it("fetches every url and reports how many succeeded", async () => {
    const fetchImpl = okFetch();
    const urls = ["a", "b", "c", "d"];
    const result = await downloadTiles(urls, { fetchImpl });
    expect(result).toEqual({ ok: 4, failed: 0, total: 4 });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("counts failures (network error or non-ok) without rejecting", async () => {
    const fetchImpl = vi.fn(async (url: unknown) => {
      if (url === "bad") throw new Error("offline");
      if (url === "404") return { ok: false } as unknown as Response;
      return { ok: true } as unknown as Response;
    });
    const result = await downloadTiles(["a", "bad", "404", "b"], { fetchImpl });
    expect(result).toEqual({ ok: 2, failed: 2, total: 4 });
  });

  it("reports progress up to the total", async () => {
    const seen: number[] = [];
    await downloadTiles(["a", "b", "c"], {
      fetchImpl: okFetch(),
      onProgress: (p) => seen.push(p.done),
    });
    expect(seen).toContain(3);
    expect(Math.max(...seen)).toBe(3);
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let max = 0;
    const fetchImpl = vi.fn(async () => {
      inFlight++;
      max = Math.max(max, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      return { ok: true } as unknown as Response;
    });
    await downloadTiles(
      Array.from({ length: 10 }, (_, i) => `u${i}`),
      { fetchImpl, concurrency: 3 },
    );
    expect(max).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(10);
  });

  it("stops early when the signal is already aborted", async () => {
    const fetchImpl = okFetch();
    const controller = new AbortController();
    controller.abort();
    const result = await downloadTiles(["a", "b"], {
      fetchImpl,
      signal: controller.signal,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.ok).toBe(0);
  });

  it("warms each url through the native store instead of fetching, when given", async () => {
    // The local bundle has no service worker, so tiles are written to the
    // native cache instead of fetched for the worker to intercept (#314).
    const warm = vi.fn(async () => {});
    const fetchImpl = okFetch();
    const result = await downloadTiles(["a", "b", "c"], { warm, fetchImpl });
    expect(result).toEqual({ ok: 3, failed: 0, total: 3 });
    expect(warm).toHaveBeenCalledTimes(3);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("counts a warm failure without rejecting", async () => {
    const warm = vi.fn(async (url: string) => {
      if (url === "bad") throw new Error("disk full");
    });
    const result = await downloadTiles(["a", "bad", "b"], { warm });
    expect(result).toEqual({ ok: 2, failed: 1, total: 3 });
  });
});

describe("regionTileUrls", () => {
  it("expands every source/tile and honours each source's max zoom", () => {
    const vector = { template: "https://t/planet/v/{z}/{x}/{y}.pbf", maxzoom: 14 };
    const dem = { template: "https://t/terrarium/{z}/{x}/{y}.png", maxzoom: 11 };
    const urls = regionTileUrls([vector, dem], BOX, 10, 12);

    const expected = countTiles(BOX, 10, 12) + countTiles(BOX, 10, 11);
    expect(urls).toHaveLength(expected);
    // The DEM caps at z11, so no DEM url should reach z12.
    expect(urls.some((u) => u.includes("/terrarium/12/"))).toBe(false);
    expect(urls.some((u) => u.includes("/planet/v/12/"))).toBe(true);
  });
});

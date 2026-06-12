import { describe, it, expect, vi } from "vitest";
import { createTileCache, tileKey, type TileStore } from "./native-tile-cache";

function fakeStore(): TileStore & { data: Map<string, ArrayBuffer> } {
  const data = new Map<string, ArrayBuffer>();
  return {
    data,
    has: async (k) => data.has(k),
    read: async (k) => data.get(k)!,
    write: async (k, d) => {
      data.set(k, d);
    },
  };
}

const bytes = (s: string): ArrayBuffer => {
  const u8 = new TextEncoder().encode(s);
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
};
const text = (buf: ArrayBuffer) =>
  new TextDecoder().decode(new Uint8Array(buf));
const res = (ok: boolean, body: string) =>
  ({ ok, arrayBuffer: async () => bytes(body) }) as unknown as Response;
const asFetch = (fn: unknown) => fn as unknown as typeof fetch;

describe("tileKey", () => {
  it("is stable and filesystem-safe", () => {
    const url = "https://tiles.openfreemap.org/planet/20240101/14/1/2.pbf";
    expect(tileKey(url)).toBe(tileKey(url));
    expect(tileKey(url)).not.toMatch(/[/:?#&=.]/);
  });

  it("differs for different tile URLs", () => {
    expect(tileKey("https://x/14/1/2.pbf")).not.toBe(
      tileKey("https://x/14/1/3.pbf"),
    );
  });
});

describe("createTileCache load (cache-first)", () => {
  it("returns the cached tile without fetching", async () => {
    const store = fakeStore();
    store.data.set(tileKey("u"), bytes("cached"));
    const fetch = vi.fn();
    const cache = createTileCache({ store, fetch: asFetch(fetch) });
    expect(text(await cache.load("u"))).toBe("cached");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches, stores, and returns a missing tile", async () => {
    const store = fakeStore();
    const fetch = vi.fn(async () => res(true, "fresh"));
    const cache = createTileCache({ store, fetch: asFetch(fetch) });
    expect(text(await cache.load("u"))).toBe("fresh");
    expect(await store.has(tileKey("u"))).toBe(true);
  });

  it("does not store a failed fetch", async () => {
    const store = fakeStore();
    const fetch = vi.fn(async () => res(false, "err"));
    const cache = createTileCache({ store, fetch: asFetch(fetch) });
    await cache.load("u");
    expect(await store.has(tileKey("u"))).toBe(false);
  });
});

describe("createTileCache warm (prefetch fill)", () => {
  it("fills a missing tile", async () => {
    const store = fakeStore();
    const fetch = vi.fn(async () => res(true, "x"));
    const cache = createTileCache({ store, fetch: asFetch(fetch) });
    await cache.warm("u");
    expect(await store.has(tileKey("u"))).toBe(true);
  });

  it("skips an already-cached tile without fetching", async () => {
    const store = fakeStore();
    store.data.set(tileKey("u"), bytes("x"));
    const fetch = vi.fn();
    const cache = createTileCache({ store, fetch: asFetch(fetch) });
    await cache.warm("u");
    expect(fetch).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  OFFLINE_TILE_SCHEME,
  offlineTilesActive,
  rewriteTileUrl,
  unwrapTileUrl,
  makeTileTransformRequest,
  createTileProtocolHandler,
  installOfflineTileProtocol,
} from "./offline-tiles";
import { API_ORIGIN } from "@/lib/api-origin";
import type { TileCache } from "./native-tile-cache";

const TILE = "https://tiles.openfreemap.org/planet/14/1/2.pbf";

describe("offlineTilesActive", () => {
  it("is on only on native loaded from the local bundle origin", () => {
    expect(offlineTilesActive(true, "capacitor://localhost")).toBe(true);
    // Native but still on the networked server.url build: SW handles tiles.
    expect(offlineTilesActive(true, API_ORIGIN)).toBe(false);
    // Web is never native.
    expect(offlineTilesActive(false, "capacitor://localhost")).toBe(false);
  });
});

describe("rewrite / unwrap", () => {
  it("round-trips a tile URL through the offline scheme", () => {
    const wrapped = rewriteTileUrl(TILE);
    expect(wrapped.startsWith(`${OFFLINE_TILE_SCHEME}://`)).toBe(true);
    expect(unwrapTileUrl(wrapped)).toBe(TILE);
  });
});

describe("makeTileTransformRequest", () => {
  it("routes tile requests through the scheme on native", () => {
    const transform = makeTileTransformRequest(true);
    expect(transform(TILE, "Tile")).toEqual({ url: rewriteTileUrl(TILE) });
  });

  it("leaves non-tile requests and the web alone", () => {
    expect(makeTileTransformRequest(true)(TILE, "Style")).toBeUndefined();
    expect(makeTileTransformRequest(false)(TILE, "Tile")).toBeUndefined();
  });
});

describe("createTileProtocolHandler", () => {
  it("serves a tile from the cache, unwrapping the scheme", async () => {
    const data = new Uint8Array([1, 2, 3]).buffer;
    const cache: TileCache = {
      load: vi.fn(async () => data),
      warm: vi.fn(),
    };
    const handler = createTileProtocolHandler(cache);
    const result = await handler({ url: rewriteTileUrl(TILE) });
    expect(result).toEqual({ data });
    expect(cache.load).toHaveBeenCalledWith(TILE);
  });
});

describe("installOfflineTileProtocol", () => {
  it("registers the protocol once (idempotent)", () => {
    const addProtocol = vi.fn();
    const cache: TileCache = { load: vi.fn(), warm: vi.fn() };
    installOfflineTileProtocol({ addProtocol }, { cache });
    installOfflineTileProtocol({ addProtocol }, { cache });
    expect(addProtocol).toHaveBeenCalledTimes(1);
    expect(addProtocol).toHaveBeenCalledWith(
      OFFLINE_TILE_SCHEME,
      expect.any(Function),
    );
  });
});

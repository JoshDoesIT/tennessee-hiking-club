import { createTileCache, type TileCache } from "./native-tile-cache";
import { createFilesystemTileStore } from "./tile-store-fs";
import { API_ORIGIN } from "@/lib/api-origin";

/**
 * The MapLibre side of the service-worker-free tile cache (spec 0007 / 0009,
 * #314). On native, each map's `transformRequest` rewrites tile URLs to a custom
 * protocol whose handler serves them cache-first from on-device storage, which
 * is what makes the maps work offline once the app loads from the local bundle.
 * On the web nothing is rewritten (the service worker still caches tiles).
 */

export const OFFLINE_TILE_SCHEME = "thctiles";

const PREFIX = `${OFFLINE_TILE_SCHEME}://`;

/** Wrap a tile URL so MapLibre routes it through the offline protocol. */
export function rewriteTileUrl(url: string): string {
  return `${PREFIX}${url}`;
}

/** Strip the protocol wrapper back to the real tile URL. */
export function unwrapTileUrl(wrapped: string): string {
  return wrapped.startsWith(PREFIX) ? wrapped.slice(PREFIX.length) : wrapped;
}

/**
 * Whether the offline tile protocol should be active: only on native AND only
 * when the app is loaded from the local bundle (origin is not the production
 * site). On the networked `server.url` build the service worker still caches
 * tiles, so the protocol stays off until the app loads locally (spec 0009,
 * phase 3). Keeping this off-origin gate means wiring the maps now is inert
 * until that flip.
 */
export function offlineTilesActive(native: boolean, origin: string): boolean {
  return native && origin !== API_ORIGIN;
}

type TransformRequest = (
  url: string,
  resourceType?: string,
) => { url: string } | undefined;

/** A MapLibre `transformRequest` that routes tile requests through the offline
 *  protocol when active, and is a no-op otherwise. */
export function makeTileTransformRequest(active: boolean): TransformRequest {
  return (url, resourceType) => {
    if (active && resourceType === "Tile") return { url: rewriteTileUrl(url) };
    return undefined;
  };
}

type ProtocolHandler = (params: {
  url: string;
}) => Promise<{ data: ArrayBuffer }>;

/** A MapLibre protocol handler that serves a wrapped tile URL from the cache. */
export function createTileProtocolHandler(cache: TileCache): ProtocolHandler {
  return async ({ url }) => ({ data: await cache.load(unwrapTileUrl(url)) });
}

interface MapLibreProtocols {
  addProtocol(scheme: string, handler: ProtocolHandler): void;
}

let installed = false;

/** Register the offline tile protocol with MapLibre once. The cache is built
 *  from the filesystem store by default; injectable for tests. */
export function installOfflineTileProtocol(
  maplibre: MapLibreProtocols,
  deps: { cache?: TileCache } = {},
): void {
  if (installed) return;
  const cache =
    deps.cache ??
    createTileCache({ store: createFilesystemTileStore(), fetch });
  maplibre.addProtocol(OFFLINE_TILE_SCHEME, createTileProtocolHandler(cache));
  installed = true;
}

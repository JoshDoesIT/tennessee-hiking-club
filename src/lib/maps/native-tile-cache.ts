/**
 * Cache-first map-tile storage for the bundled local app (spec 0007 "service-
 * worker-free caching", spec 0009). When the app loads from the local
 * `capacitor://` origin there is no service worker to cache tiles, so a MapLibre
 * custom protocol routes tile requests through this cache instead: a cached tile
 * is read from on-device storage, a miss is fetched once and written back.
 *
 * The storage is injected (`TileStore`) so the logic is unit-tested without a
 * device; a `@capacitor/filesystem` adapter implements it on native.
 */

export interface TileStore {
  has(key: string): Promise<boolean>;
  read(key: string): Promise<ArrayBuffer>;
  write(key: string, data: ArrayBuffer): Promise<void>;
}

export interface TileCacheDeps {
  store: TileStore;
  fetch: typeof fetch;
}

export interface TileCache {
  /** Cache-first: the stored tile, or fetch + store + return it. */
  load(url: string): Promise<ArrayBuffer>;
  /** Prefetch fill: store the tile if it is not already cached. */
  warm(url: string): Promise<void>;
}

/**
 * A stable, filesystem-safe key for a tile URL. Two independent 32-bit hashes
 * (FNV-1a and djb2) are concatenated for ~64-bit collision resistance across the
 * whole tile set (every trailhead across the hiking zooms), where a collision
 * would serve the wrong tile. base36 is short and path-safe, and this avoids
 * BigInt so the build target is unchanged.
 */
export function tileKey(url: string): string {
  let fnv = 0x811c9dc5;
  let djb2 = 5381;
  for (let i = 0; i < url.length; i++) {
    const c = url.charCodeAt(i);
    fnv = Math.imul(fnv ^ c, 0x01000193);
    djb2 = (Math.imul(djb2, 33) + c) | 0;
  }
  const part = (h: number) => (h >>> 0).toString(36).padStart(7, "0");
  return "t" + part(fnv) + part(djb2);
}

export function createTileCache({ store, fetch }: TileCacheDeps): TileCache {
  return {
    async load(url) {
      const key = tileKey(url);
      if (await store.has(key)) return store.read(key);
      const response = await fetch(url);
      const data = await response.arrayBuffer();
      if (response.ok) await store.write(key, data);
      return data;
    },
    async warm(url) {
      const key = tileKey(url);
      if (await store.has(key)) return;
      const response = await fetch(url);
      if (response.ok) await store.write(key, await response.arrayBuffer());
    },
  };
}

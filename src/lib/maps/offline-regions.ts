import type { LngLatBounds } from "./tiles";

/**
 * Saved offline-map regions, stored in the browser (mirrors
 * `hikes/local-log.ts`). Each region records the bounding box and zoom range a
 * member downloaded so it can be listed, re-opened, and cleared (#217, spec
 * 0007). The tiles themselves live in the service worker's Cache Storage; this
 * is just the index of what was downloaded.
 *
 * `storage` is injectable for tests; in the browser it defaults to
 * `localStorage`, and on the server it is a no-op so the module imports safely
 * anywhere. Components read via `useSyncExternalStore(subscribe,
 * getRegionsSnapshot, getServerRegionsSnapshot)`.
 */
export type OfflineRegion = {
  id: string;
  name: string;
  bounds: LngLatBounds;
  minZoom: number;
  maxZoom: number;
  tileCount: number;
  /** ISO timestamp of when the region finished downloading. */
  savedAt: string;
};

const KEY = "tnhc:offline-regions";
const EMPTY: OfflineRegion[] = [];

function store(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isBounds(x: unknown): x is LngLatBounds {
  if (!x || typeof x !== "object") return false;
  const b = x as Record<string, unknown>;
  return (
    typeof b.west === "number" &&
    typeof b.south === "number" &&
    typeof b.east === "number" &&
    typeof b.north === "number"
  );
}

function isRegion(x: unknown): x is OfflineRegion {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    isBounds(r.bounds) &&
    typeof r.minZoom === "number" &&
    typeof r.maxZoom === "number" &&
    typeof r.tileCount === "number" &&
    typeof r.savedAt === "string"
  );
}

function parse(raw: string | null): OfflineRegion[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isRegion) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function readRegions(storage?: Storage): OfflineRegion[] {
  const s = store(storage);
  return s ? parse(s.getItem(KEY)) : EMPTY;
}

function write(regions: OfflineRegion[], storage?: Storage): void {
  store(storage)?.setItem(KEY, JSON.stringify(regions));
  emit();
}

/** Save a region, newest first; re-saving the same id replaces it in place. */
export function saveRegion(
  region: OfflineRegion,
  storage?: Storage,
): OfflineRegion[] {
  const next = [region, ...readRegions(storage).filter((r) => r.id !== region.id)];
  write(next, storage);
  return next;
}

export function removeRegion(id: string, storage?: Storage): OfflineRegion[] {
  const next = readRegions(storage).filter((r) => r.id !== id);
  write(next, storage);
  return next;
}

export function clearRegions(storage?: Storage): OfflineRegion[] {
  // No region remains, so its tile-url index is meaningless too (#236).
  store(storage)?.removeItem(TILES_KEY);
  write(EMPTY, storage);
  return EMPTY;
}

// --- Per-region tile index (for exact eviction, #236) --------------------

/**
 * The exact tile URLs each region downloaded, kept under a separate key (not in
 * the region records, so the snapshot stays light). Storing the real fetched
 * URLs means eviction is version-correct: vector tiles carry a dated version in
 * their URL, and recomputing later could miss them, but the stored URL always
 * matches what was cached. Reference-counting across regions (`evictableTiles`)
 * keeps tiles that another saved region still needs.
 */
const TILES_KEY = "tnhc:offline-region-tiles";
export type RegionTileIndex = Record<string, string[]>;

function parseTileIndex(raw: string | null): RegionTileIndex {
  try {
    const parsed = JSON.parse(raw ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: RegionTileIndex = {};
    for (const [id, urls] of Object.entries(parsed)) {
      if (Array.isArray(urls) && urls.every((u) => typeof u === "string")) {
        out[id] = urls as string[];
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function readRegionTiles(storage?: Storage): RegionTileIndex {
  const s = store(storage);
  return s ? parseTileIndex(s.getItem(TILES_KEY)) : {};
}

export function saveRegionTiles(
  id: string,
  urls: string[],
  storage?: Storage,
): void {
  const index = readRegionTiles(storage);
  index[id] = urls;
  store(storage)?.setItem(TILES_KEY, JSON.stringify(index));
}

export function removeRegionTiles(id: string, storage?: Storage): void {
  const index = readRegionTiles(storage);
  if (!(id in index)) return;
  delete index[id];
  store(storage)?.setItem(TILES_KEY, JSON.stringify(index));
}

/** Tiles owned by `id` that no other region in `index` also holds, i.e. the set
 *  safe to delete when removing that region. */
export function evictableTiles(index: RegionTileIndex, id: string): string[] {
  const mine = index[id];
  if (!mine) return [];
  const kept = new Set<string>();
  for (const [otherId, urls] of Object.entries(index)) {
    if (otherId === id) continue;
    for (const url of urls) kept.add(url);
  }
  return mine.filter((url) => !kept.has(url));
}

// --- External-store interface for useSyncExternalStore -------------------

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

let cache: { raw: string; value: OfflineRegion[] } = { raw: "", value: EMPTY };

/** Cached snapshot so repeated reads return a stable reference. */
export function getRegionsSnapshot(): OfflineRegion[] {
  const s = store();
  if (!s) return EMPTY;
  const raw = s.getItem(KEY) ?? "[]";
  if (raw !== cache.raw) cache = { raw, value: parse(raw) };
  return cache.value;
}

export function getServerRegionsSnapshot(): OfflineRegion[] {
  return EMPTY;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) emit();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

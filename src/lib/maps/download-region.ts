import {
  countTiles,
  enumerateTiles,
  expandTemplate,
  type LngLatBounds,
} from "./tiles";

/**
 * Tile-download orchestration for "download this area" (#217, spec 0007).
 *
 * The actual caching is a side effect: every `fetch()` of a tile URL from a
 * controlled page is intercepted by the service worker and stored in its tile
 * cache. So downloading a region is just fetching its tile URLs (with bounded
 * concurrency and progress), letting the worker do the persisting. `fetch` is
 * injected so this is unit-testable without a network or a worker.
 */

export type TileSource = {
  /** A `{z}/{x}/{y}` URL template. */
  template: string;
  minzoom?: number;
  maxzoom?: number;
};

export type DownloadProgress = { done: number; total: number; failed: number };
export type DownloadResult = { ok: number; failed: number; total: number };

export type DownloadOptions = {
  fetchImpl?: typeof fetch;
  concurrency?: number;
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
};

/**
 * Expand the tile URLs covering `bounds` across the zoom range for every
 * source, clamping each source to its own min/max zoom (the elevation DEM stops
 * at a lower zoom than the vector base, so it contributes no tiles past it).
 */
export function regionTileUrls(
  sources: TileSource[],
  bounds: LngLatBounds,
  minZoom: number,
  maxZoom: number,
): string[] {
  const urls: string[] = [];
  for (const source of sources) {
    const lo = Math.max(minZoom, source.minzoom ?? 0);
    const hi = Math.min(maxZoom, source.maxzoom ?? maxZoom);
    if (lo > hi) continue;
    for (const tile of enumerateTiles(bounds, lo, hi)) {
      urls.push(expandTemplate(source.template, tile));
    }
  }
  return urls;
}

/**
 * Total tiles a region download would fetch across all sources (each clamped to
 * its own zoom range), for the "~N tiles" estimate. Never throws, so it is safe
 * to call on an over-large area to decide whether to offer the download.
 */
export function countRegionTiles(
  sources: TileSource[],
  bounds: LngLatBounds,
  minZoom: number,
  maxZoom: number,
): number {
  let total = 0;
  for (const source of sources) {
    const lo = Math.max(minZoom, source.minzoom ?? 0);
    const hi = Math.min(maxZoom, source.maxzoom ?? maxZoom);
    if (lo > hi) continue;
    total += countTiles(bounds, lo, hi);
  }
  return total;
}

/**
 * Fetch every URL with bounded concurrency, counting successes and failures.
 * Never rejects: a few failed tiles must not abort a whole region download. A
 * few missing tiles just fall back to the network (or a blank) on the trail.
 */
export async function downloadTiles(
  urls: string[],
  opts: DownloadOptions = {},
): Promise<DownloadResult> {
  const { fetchImpl = fetch, concurrency = 6, onProgress, signal } = opts;
  const total = urls.length;
  let ok = 0;
  let failed = 0;
  let done = 0;
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      if (signal?.aborted) return;
      const url = urls[index++];
      try {
        const res = await fetchImpl(url, signal ? { signal } : undefined);
        if (res && res.ok) ok++;
        else failed++;
      } catch {
        failed++;
      }
      done++;
      onProgress?.({ done, total, failed });
    }
  }

  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), urls.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return { ok, failed, total };
}

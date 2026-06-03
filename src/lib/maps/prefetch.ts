import { type LngLatBounds } from "./tiles";
import { resolveTileSources } from "./tile-sources";
import { regionTileUrls, downloadTiles } from "./download-region";

/**
 * Silent offline-map prefetch (#244). On the first online launch the native app
 * caches the tiles around every trailhead at hiking zoom levels, so the maps
 * work offline everywhere with no "download this area" step. The service worker
 * does the caching (it intercepts these fetches, cache-first), so re-running on
 * later launches is cheap: already-cached tiles return without hitting the
 * network.
 */

/** Half-width of each cached box, in degrees (~4.5 km). */
const MARGIN_DEG = 0.04;
/** Hiking zoom range; the vector base tops out at 14 and MapLibre over-zooms it
 *  for closer views, so 12-14 covers all zooms. */
const MIN_ZOOM = 12;
const MAX_ZOOM = 14;
/** Gentle: this runs in the background across many trails. */
const PREFETCH_CONCURRENCY = 3;

export function trailBounds(
  center: { lat: number; lng: number },
  margin = MARGIN_DEG,
): LngLatBounds {
  return {
    west: center.lng - margin,
    east: center.lng + margin,
    south: center.lat - margin,
    north: center.lat + margin,
  };
}

function defaultIsOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export type PrefetchResult = { ok: number; failed: number; trails: number };

/**
 * Cache the map tiles around every trailhead. A no-op when offline; otherwise
 * best-effort, one trail at a time so it stays gentle in the background.
 * Resolves the tile sources once and reuses them for all trails.
 */
export async function prefetchAllTrailAreas(
  centers: Array<{ lat: number; lng: number }>,
  opts: {
    fetchImpl?: typeof fetch;
    signal?: AbortSignal;
    isOnline?: () => boolean;
  } = {},
): Promise<PrefetchResult | null> {
  const isOnline = opts.isOnline ?? defaultIsOnline;
  if (!isOnline()) return null;

  const sources = await resolveTileSources(opts.fetchImpl);
  let ok = 0;
  let failed = 0;
  let trails = 0;
  for (const center of centers) {
    if (opts.signal?.aborted) break;
    const urls = regionTileUrls(
      sources,
      trailBounds(center),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const result = await downloadTiles(urls, {
      concurrency: PREFETCH_CONCURRENCY,
      fetchImpl: opts.fetchImpl,
      signal: opts.signal,
    });
    ok += result.ok;
    failed += result.failed;
    trails += 1;
  }
  return { ok, failed, trails };
}

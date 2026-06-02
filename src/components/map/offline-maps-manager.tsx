"use client";

import { useState, useSyncExternalStore } from "react";
import {
  subscribe,
  getRegionsSnapshot,
  getServerRegionsSnapshot,
  removeRegion,
  clearRegions,
  type OfflineRegion,
} from "@/lib/maps/offline-regions";
import { regionTileUrls } from "@/lib/maps/download-region";
import { resolveTileSources } from "@/lib/maps/tile-sources";
import { clearOfflineTiles, deleteOfflineTiles } from "@/lib/maps/tile-cache";

function savedOn(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

/** Best-effort: recompute the region's tile URLs and ask the worker to drop
 *  them. Vector tiles carry a dated version, so this reliably reclaims the
 *  elevation tiles and any vector tiles whose version has not rolled over since
 *  download; "Clear all" is the guaranteed full reclaim. */
async function evictRegionTiles(region: OfflineRegion): Promise<void> {
  try {
    const sources = await resolveTileSources();
    const urls = regionTileUrls(
      sources,
      region.bounds,
      region.minZoom,
      region.maxZoom,
    );
    if (urls.length) await deleteOfflineTiles(urls);
  } catch {
    // Removing from the list is what the member sees; tile eviction is a bonus.
  }
}

/**
 * Manage downloaded offline map areas (#217, spec 0007): list what has been
 * saved, remove one, or clear them all. Reads the local region index via
 * `useSyncExternalStore` so it stays in sync with downloads made elsewhere on
 * the page.
 */
export function OfflineMapsManager() {
  const regions = useSyncExternalStore(
    subscribe,
    getRegionsSnapshot,
    getServerRegionsSnapshot,
  );
  const [confirmingClear, setConfirmingClear] = useState(false);

  function onRemove(region: OfflineRegion) {
    removeRegion(region.id);
    void evictRegionTiles(region);
  }

  function onClearAll() {
    clearRegions();
    setConfirmingClear(false);
    void clearOfflineTiles();
  }

  return (
    <section aria-labelledby="offline-maps-heading" className="mt-8">
      <h2
        id="offline-maps-heading"
        className="font-display text-forest text-xl"
      >
        Offline maps
      </h2>
      <p className="text-pine mt-1 text-sm">
        Download a trailhead before you lose signal, then use it on the trail
        with no connection.
      </p>

      {regions.length === 0 ? (
        <p className="text-pine/80 mt-4 text-sm italic">
          No areas downloaded yet. Pan the map to a trailhead and choose
          “Download this area.”
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {regions.map((region) => (
            <li
              key={region.id}
              className="border-forest/15 bg-cream flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-ink truncate font-medium">{region.name}</p>
                <p className="text-pine text-xs">
                  zoom {region.minZoom}–{region.maxZoom} ·{" "}
                  {region.tileCount.toLocaleString()} tiles
                  {region.savedAt ? ` · saved ${savedOn(region.savedAt)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(region)}
                aria-label={`Remove ${region.name}`}
                className="text-forest hover:text-amber shrink-0 text-sm font-medium underline-offset-2 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {regions.length > 0 ? (
        confirmingClear ? (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="text-pine">
              Clear all downloaded tiles? You can download them again later.
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="bg-forest text-cream rounded-lg px-3 py-1.5 font-medium"
            >
              Confirm clear
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="text-pine hover:text-forest"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="text-pine hover:text-amber mt-4 text-sm underline-offset-2 hover:underline"
          >
            Clear all downloaded tiles
          </button>
        )
      ) : null}
    </section>
  );
}

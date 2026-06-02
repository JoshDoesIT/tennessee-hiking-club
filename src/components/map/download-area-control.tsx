"use client";

import { useState } from "react";
import { MAX_TILES, type LngLatBounds } from "@/lib/maps/tiles";
import {
  countRegionTiles,
  downloadTiles,
  regionTileUrls,
  type TileSource,
} from "@/lib/maps/download-region";
import { resolveTileSources } from "@/lib/maps/tile-sources";
import { saveRegion, saveRegionTiles } from "@/lib/maps/offline-regions";

export type Viewport = { bounds: LngLatBounds; zoom: number };

/** How many extra zoom levels beyond the current view to pull, capped at the
 *  base map's max zoom. Enough to pan and zoom in a little while offline. */
const ZOOM_SPREAD = 2;
const BASE_MAX_ZOOM = 14;
/** Rough average compressed tile size, for the "~N MB" estimate only. */
const AVG_TILE_BYTES = 45_000;

type Plan = {
  bounds: LngLatBounds;
  minZoom: number;
  maxZoom: number;
  sources: TileSource[];
  estimate: number;
};

type Phase = "idle" | "preparing" | "ready" | "downloading" | "done" | "error";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.floor(performance.now())}`;
}

function defaultName(bounds: LngLatBounds): string {
  const lat = (bounds.south + bounds.north) / 2;
  const lng = (bounds.west + bounds.east) / 2;
  return `Area (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}

function megabytes(tiles: number): string {
  const mb = (tiles * AVG_TILE_BYTES) / 1_000_000;
  return mb < 1 ? "<1 MB" : `~${Math.round(mb)} MB`;
}

/**
 * "Download this area for offline" control (#217, spec 0007). Reads the current
 * map viewport via `getViewport`, estimates the tiles to pull, and on confirm
 * fetches them (the service worker caches each) and records the region.
 *
 * The live-map wiring lives in the parent; this component is the whole flow
 * (estimate, name, progress, save) so it stays testable without a real map.
 */
export function DownloadAreaControl({
  getViewport,
}: {
  getViewport: () => Viewport | null;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [name, setName] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [saved, setSaved] = useState(0);
  const [error, setError] = useState("");

  function reset() {
    setPhase("idle");
    setPlan(null);
    setProgress({ done: 0, total: 0 });
  }

  async function prepare() {
    const viewport = getViewport();
    if (!viewport) {
      setError("Move the map to the area you want, then try again.");
      setPhase("error");
      return;
    }
    setPhase("preparing");
    const minZoom = Math.max(0, Math.floor(viewport.zoom));
    const maxZoom = Math.min(BASE_MAX_ZOOM, minZoom + ZOOM_SPREAD);
    const sources = await resolveTileSources();
    const estimate = countRegionTiles(sources, viewport.bounds, minZoom, maxZoom);
    setPlan({ bounds: viewport.bounds, minZoom, maxZoom, sources, estimate });
    setName(defaultName(viewport.bounds));
    setPhase("ready");
  }

  async function start() {
    if (!plan) return;
    setPhase("downloading");
    setProgress({ done: 0, total: plan.estimate });
    const urls = regionTileUrls(
      plan.sources,
      plan.bounds,
      plan.minZoom,
      plan.maxZoom,
    );
    const result = await downloadTiles(urls, {
      onProgress: (p) => setProgress({ done: p.done, total: p.total }),
    });
    const id = newId();
    saveRegion({
      id,
      name: name.trim() || defaultName(plan.bounds),
      bounds: plan.bounds,
      minZoom: plan.minZoom,
      maxZoom: plan.maxZoom,
      tileCount: result.ok,
      savedAt: new Date().toISOString(),
    });
    // Record the exact URLs fetched so removing this region later evicts
    // precisely these tiles, even after the vector version rolls over (#236).
    saveRegionTiles(id, urls);
    setSaved(result.ok);
    setPhase("done");
  }

  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={prepare}
        className="bg-forest/95 text-cream rounded-lg px-3 py-2 text-sm font-medium shadow-sm backdrop-blur hover:bg-forest"
      >
        Download this area
      </button>
    );
  }

  const tooLarge = plan ? plan.estimate > MAX_TILES : false;

  return (
    <div className="bg-cream/95 border-forest/15 w-64 rounded-xl border p-3 text-sm shadow-md backdrop-blur">
      {phase === "preparing" ? (
        <p className="text-pine" aria-live="polite">
          Measuring this area…
        </p>
      ) : null}

      {phase === "error" ? (
        <>
          <p className="text-ink" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-forest mt-2 font-medium hover:underline"
          >
            OK
          </button>
        </>
      ) : null}

      {phase === "ready" && plan ? (
        <>
          <p className="text-ink">
            About {plan.estimate.toLocaleString()} tiles ({megabytes(plan.estimate)})
            at zoom {plan.minZoom}–{plan.maxZoom}.
          </p>
          {tooLarge ? (
            <>
              <p className="text-pine mt-2">
                That is a lot to store. Zoom in to download a smaller area.
              </p>
              <button
                type="button"
                onClick={reset}
                className="text-forest mt-2 font-medium hover:underline"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <label className="text-pine mt-3 block text-xs" htmlFor="region-name">
                Name this area
              </label>
              <input
                id="region-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-forest/20 bg-background mt-1 w-full rounded-md border px-2 py-1 text-sm"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={start}
                  className="bg-forest text-cream rounded-lg px-3 py-1.5 font-medium"
                >
                  Start download
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="text-pine hover:text-forest"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </>
      ) : null}

      {phase === "downloading" ? (
        <div aria-live="polite">
          <p className="text-ink">
            Downloading… {progress.done.toLocaleString()} /{" "}
            {progress.total.toLocaleString()} tiles
          </p>
          <div className="bg-forest/15 mt-2 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-forest h-full transition-all"
              style={{
                width: `${
                  progress.total
                    ? Math.round((progress.done / progress.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {phase === "done" ? (
        <>
          <p className="text-ink" aria-live="polite">
            {saved.toLocaleString()} tiles available offline.
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-forest mt-2 font-medium hover:underline"
          >
            Done
          </button>
        </>
      ) : null}
    </div>
  );
}

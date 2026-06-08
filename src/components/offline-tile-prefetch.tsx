"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { prefetchAllTrailAreas } from "@/lib/maps/prefetch";
import { offlineTilesActive } from "@/lib/maps/offline-tiles";
import { createTileCache } from "@/lib/maps/native-tile-cache";
import { createFilesystemTileStore } from "@/lib/maps/tile-store-fs";

/**
 * On the first online launch in the native app, cache the map tiles around
 * every trailhead so the maps work offline everywhere with no manual download
 * (#244). Renders nothing; best-effort and gentle, so later launches are cheap
 * cache hits. Aborts if the app is left mid-prefetch.
 *
 * Two paths: on the networked `server.url` build the service worker caches the
 * fetched tiles; on the local bundle there is no worker, so the tiles are
 * written straight into the native tile store (#314).
 */
export function OfflineTilePrefetch({
  trailheads,
}: {
  trailheads: Array<{ lat: number; lng: number }>;
}) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const controller = new AbortController();

    if (offlineTilesActive(true, window.location.origin)) {
      // Local bundle: no service worker, so fill the native tile store directly.
      const cache = createTileCache({
        store: createFilesystemTileStore(),
        fetch,
      });
      void prefetchAllTrailAreas(trailheads, {
        signal: controller.signal,
        warm: (url) => cache.warm(url),
      }).catch(() => undefined);
      return () => controller.abort();
    }

    // Networked build: the service worker caches the fetched tiles.
    const sw =
      typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;
    if (!sw) return;
    void sw.ready
      .then(() =>
        prefetchAllTrailAreas(trailheads, { signal: controller.signal }),
      )
      .catch(() => undefined);

    return () => controller.abort();
  }, [trailheads]);

  return null;
}

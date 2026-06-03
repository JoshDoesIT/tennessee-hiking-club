"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { prefetchAllTrailAreas } from "@/lib/maps/prefetch";

/**
 * On the first online launch in the native app, cache the map tiles around
 * every trailhead so the maps work offline everywhere with no manual download
 * (#244). Renders nothing; best-effort and gentle (the service worker caches
 * the tiles, so later launches are cheap cache hits). Aborts if the app is left
 * mid-prefetch.
 */
export function OfflineTilePrefetch({
  trailheads,
}: {
  trailheads: Array<{ lat: number; lng: number }>;
}) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sw =
      typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;
    if (!sw) return;

    const controller = new AbortController();
    void sw.ready
      .then(() =>
        prefetchAllTrailAreas(trailheads, { signal: controller.signal }),
      )
      .catch(() => undefined);

    return () => controller.abort();
  }, [trailheads]);

  return null;
}

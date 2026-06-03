"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * On the first online visit in the native app, ask the service worker to cache
 * every app page so the whole app is navigable offline, not just the pages that
 * were browsed (#244). Renders nothing.
 *
 * Native only: offline matters on the trail, and proactively fetching every
 * page would waste bandwidth for ordinary web visitors, who keep the lazy
 * cache-as-you-browse behaviour.
 */
export function OfflinePrecache({ routes }: { routes: string[] }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sw =
      typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;
    if (!sw) return;

    let cancelled = false;
    void sw.ready.then((registration) => {
      if (cancelled) return;
      registration.active?.postMessage({ type: "TNHC_PRECACHE", routes });
    });

    return () => {
      cancelled = true;
    };
  }, [routes]);

  return null;
}

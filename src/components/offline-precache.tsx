"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { extractImageUrls } from "@/lib/offline/precache-images";

/** Warm a few pages at a time so the first visit does not hammer the link. */
const BATCH = 6;

/**
 * On the first online visit in the native app, fetch every app page (and each
 * page's photos) so the service worker caches them, making the whole app
 * navigable offline with images rather than just the pages that were browsed
 * (#244). Renders nothing.
 *
 * The pages are warmed by the client (the routes are app data), and the service
 * worker caches the responses as they pass through; the worker never fetches a
 * URL it was handed in a message. Native only: offline matters on the trail,
 * and ordinary web visitors keep the lazy cache-as-you-browse behaviour.
 */
export function OfflinePrecache({ routes }: { routes: string[] }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sw =
      typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;
    if (!sw) return;

    let cancelled = false;
    void sw.ready.then(async () => {
      // Asking for text/html makes the worker treat each as a page document and
      // cache it. We also warm the page's photos by fetching exactly the
      // `/_next/image` URLs in its markup, so trails the member never opened
      // still show images offline (#244), with no width guessing. Best-effort;
      // a failed page or image just stays uncached.
      const warmRoute = async (route: string) => {
        try {
          const res = await fetch(route, { headers: { Accept: "text/html" } });
          const images = extractImageUrls(await res.text());
          await Promise.all(
            images.map((url) => fetch(url).catch(() => undefined)),
          );
        } catch {
          /* best-effort */
        }
      };

      for (let i = 0; i < routes.length && !cancelled; i += BATCH) {
        await Promise.all(routes.slice(i, i + BATCH).map(warmRoute));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [routes]);

  return null;
}

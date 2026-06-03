/*
 * Tennessee Hiking Club service worker (#215, spec 0006).
 *
 * Runtime caching so the app keeps working offline after the first online open,
 * which is what the Capacitor shell needs on the trail. There is no precache
 * manifest: pages, build assets, and map tiles are cached as they are first
 * fetched, and the offline fallback page is the one thing precached on install.
 * API requests are never cached, so auth and sync always hit the network.
 */

const VERSION = "v2";
const PAGES = `tnhc-pages-${VERSION}`;
const ASSETS = `tnhc-assets-${VERSION}`;
const TILES = `tnhc-tiles-${VERSION}`;
const KEEP = new Set([PAGES, ASSETS, TILES]);
const OFFLINE_URL = "/offline";

// Map tile sources to cache for offline navigation (#217 builds on this).
const TILE_HOSTS = ["tiles.openfreemap.org", "s3.amazonaws.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PAGES);
        await cache.add(OFFLINE_URL);
      } catch {
        // The fallback will be cached on first navigation instead.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (KEEP.has(key) ? null : caches.delete(key))),
      );
      await self.clients.claim();
    })(),
  );
});

function isTileRequest(url) {
  if (!TILE_HOSTS.includes(url.hostname)) return false;
  // Only the elevation tiles on the shared S3 bucket, not anything else there.
  if (url.hostname === "s3.amazonaws.com") {
    return url.pathname.includes("elevation-tiles-prod");
  }
  return true;
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|webp|gif|ico|json)$/.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function navigateNetworkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match(OFFLINE_URL)) ||
      Response.error()
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Map tiles: cache-first (immutable, the big win offline).
  if (isTileRequest(url)) {
    event.respondWith(cacheFirst(request, TILES));
    return;
  }

  // Everything else we handle is same-origin.
  if (url.origin !== self.location.origin) return;

  // Never cache API / auth / dynamic data; always go to the network.
  if (url.pathname.startsWith("/api/")) return;

  // Hashed build assets and images: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
    return;
  }

  // Page documents: real navigations and the client's offline warm-up fetches
  // (#244) both ask for `text/html`. Network-first, fall back to cache, then the
  // offline page. Caching the warm-up fetches is what makes pages the member
  // never opened still load offline. (App Router RSC requests ask for
  // `text/x-component`, so they are not cached here and never collide with the
  // HTML cached under the same URL.)
  const accept = request.headers.get("accept") || "";
  if (request.mode === "navigate" || accept.includes("text/html")) {
    event.respondWith(navigateNetworkFirst(request));
  }
});

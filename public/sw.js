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
// App Router serves in-app navigations as RSC payloads (Accept: text/x-component
// / a `?_rsc=` query), cached separately from the HTML documents under the same
// route URL.
const RSC = `tnhc-rsc-${VERSION}`;
const KEEP = new Set([PAGES, ASSETS, TILES, RSC]);
const OFFLINE_URL = "/offline";

// Cap how long a network-first request may wait before falling back to cache.
// Offline, a dead connection in the native WebView can otherwise hang a fetch
// instead of failing fast, which froze in-app navigation (#244).
const NETWORK_TIMEOUT_MS = 3500;

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
    // Next/Image optimized photos are served from `/_next/image?url=...`; the
    // path has no file extension, so match it explicitly or trail photos never
    // get cached and go blank offline (#244).
    url.pathname === "/_next/image" ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|webp|gif|ico|json)$/.test(url.pathname)
  );
}

/** An App Router client navigation fetching an RSC payload for a route. */
function isRscRequest(url, request) {
  const accept = request.headers.get("accept") || "";
  return (
    accept.includes("text/x-component") ||
    request.headers.get("rsc") === "1" ||
    url.searchParams.has("_rsc")
  );
}

/** Fetch that aborts (and so rejects) once the network has stalled too long,
 *  so a hung connection falls back to cache instead of freezing the UI. */
function fetchWithTimeout(request) {
  if (typeof AbortController === "undefined") return fetch(request);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  return fetch(request, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetchWithTimeout(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Offline and uncached: fail fast rather than hang the request. An uncached
    // map tile or style otherwise stalls the whole map until the network is
    // back (#244).
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetchWithTimeout(request)
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
    const response = await fetchWithTimeout(request);
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

// In-app navigation payloads (RSC). Network-first with the same timeout, so a
// tapped link either gets the fresh payload, the cached one, or fails fast.
// A fast failure makes the App Router fall back to a hard navigation, which the
// page cache then serves, instead of hanging on a dead connection (#244).
async function rscNetworkFirst(request) {
  const cache = await caches.open(RSC);
  try {
    const response = await fetchWithTimeout(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
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

  // In-app navigation payloads (RSC): network-first with a timeout so a tapped
  // link never hangs offline (#244). Checked before the static/HTML branches
  // because an RSC request targets a route path, not an asset or a document.
  if (isRscRequest(url, request)) {
    event.respondWith(rscNetworkFirst(request));
    return;
  }

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

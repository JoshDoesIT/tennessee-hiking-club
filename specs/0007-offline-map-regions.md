# 0007: Offline map regions ("download this area")

- **Status:** in progress
- **Issue:** #217 (part of the native mobile build, #202 / spec 0006)
- **Depends on:** the Capacitor shell (#215) and the offline service worker (#224)

## Problem

Cell coverage is poor or absent in the gorges and backcountry, which is exactly
where a hiker needs the map most. The service worker already caches map tiles
*cache-first as they are fetched* (`public/sw.js`), so panning ground you have
already viewed online works offline. But a hiker cannot pre-load a trailhead
they have not visited yet. #217 adds an explicit "download this area for
offline" action plus a way to see, re-open, and clear what has been downloaded.

## Tiles we depend on

The detail map is MapLibre with key-free, open data (see `build-style.ts`):

- **Vector base** (OpenFreeMap `openmaptiles`): the style's `openmaptiles`
  source resolves a TileJSON at `https://tiles.openfreemap.org/planet` whose
  tile template carries a **dated version segment**
  (`…/planet/<version>/{z}/{x}/{y}.pbf`, maxzoom 14). The version changes over
  time, so the download resolves the current template from the TileJSON at run
  time rather than hard-coding it.
- **Terrain / hillshade DEM** (AWS Terrarium): `…/terrarium/{z}/{x}/{y}.png`,
  maxzoom 13.

Both hosts are already in the service worker's `TILE_HOSTS`, so any `fetch()` of
a tile URL from a controlled page is intercepted and stored in the
`tnhc-tiles-<version>` cache. That is the whole prefetch mechanism: enumerate
the tile URLs for a bounding box and `fetch()` them; the service worker caches
them. No second copy of the caching logic, and it works identically in the
browser PWA and the Capacitor WebView.

## Design

### Pure core (unit-tested)

- `src/lib/maps/tiles.ts`: Web Mercator slippy-map math.
  - `lngLatToTile(lng, lat, z)` and the inverse range for a bounding box.
  - `enumerateTiles(bounds, minZoom, maxZoom)` and `countTiles(...)` (the count
    without allocating, for the "~N tiles / ~M MB" estimate), clamped to a hard
    `MAX_TILES` ceiling so a careless zoom range cannot try to fetch the planet.
  - `expandTemplate(template, tile)` to fill `{z}/{x}/{y}`.
- `src/lib/maps/offline-regions.ts`: a `localStorage`-backed store of saved
  regions (`tnhc:offline-regions`), mirroring `hikes/local-log.ts`
  (injectable storage, `useSyncExternalStore` snapshot, storage-event
  subscribe). A region is `{ id, name, bounds, minZoom, maxZoom, tileCount,
  savedAt }`.
- `src/lib/maps/download-region.ts`: `downloadRegion(...)` fetches the tile URLs
  with bounded concurrency, reports progress, and returns an ok/failed summary.
  `fetch` is injected for tests. Caching is a side effect of the service worker.

### Service worker

A `message` handler so the management UI can reclaim space:

- `{ type: "TNHC_CLEAR_TILES" }` deletes the whole `tnhc-tiles-*` cache.
- `{ type: "TNHC_DELETE_TILES", urls }` deletes specific tile URLs.

No cache-version bump (that would needlessly evict everyone's existing tiles);
the handler is additive and ships via the existing update-on-focus path.

### UI

- A "Download this area" control on the terrain map reads the current map
  bounds, resolves the current planet template, estimates the tile count, takes
  a short name, downloads with a progress indicator, and saves the region.
- An "Offline maps" manager lists saved regions with their size and a Delete,
  plus "Clear all". Mounted on `/explore` beneath the map.

## Acceptance criteria (from #217)

1. After downloading a region, the map renders and pans with the device offline.
2. Trail detail and its map are usable offline.
3. Downloaded areas can be viewed, managed, and cleared.

AC 1 and 2 are verified on device (offline after first open) and tracked the way
the other mobile phases are; AC 3 and all pure logic are covered by automated
tests.

## Out of scope (v1)

- Precise per-region eviction (tracked in #236): deleting a region removes its
  tiles best-effort. Vector tiles carry a dated version, so a region saved
  before a version roll-over only fully clears via "Clear all"; overlapping
  regions share tiles. Acceptable for v1; re-downloading re-caches.
- A native (filesystem) tile store separate from Cache Storage; the WebView
  cache is sufficient for the first release.

# 0007: Offline maps (silent all-trail prefetch)

- **Status:** implemented (pending on-device verification)
- **Issue:** #217 / #244 (part of the native mobile build, #202 / spec 0006)
- **Depends on:** the Capacitor shell (#215) and the offline service worker (#224)

## Problem

Cell coverage is poor or absent in the gorges and backcountry, which is exactly
where a hiker needs the map most. The service worker caches tiles cache-first as
they are fetched, so panning ground you have already viewed online works
offline. The gap is the trailheads you have not opened, at the zoom levels you
never reached.

An earlier version added an explicit "Download this area" control plus a manager
to list and clear regions. On device that proved redundant and awkward
(browsing already caches silently, the WebView keeps its own HTTP cache so
"Clear all" could not fully reclaim, and it put work on the user). **The
implemented design is silent and complete:** the native app caches the map area
around *every* trailhead on the first online launch, so all the maps work
offline with no action from the member.

## Tiles we depend on

MapLibre with key-free, open data (see `build-style.ts`):

- **Vector base** (OpenFreeMap): a TileJSON at
  `https://tiles.openfreemap.org/planet` whose tile template carries a dated
  version segment, resolved at run time. Maxzoom 14.
- **Terrain / hillshade DEM** (AWS Terrarium): `…/terrarium/{z}/{x}/{y}.png`,
  maxzoom 13.

Both hosts are in the service worker's `TILE_HOSTS`, so any `fetch()` of a tile
URL is intercepted and cached. The prefetch is just: enumerate the tile URLs for
a bounding box and `fetch()` them; the worker caches them. Re-running later is
cheap because already-cached tiles return without a network hit.

## Design

- `src/lib/maps/tiles.ts`: Web Mercator slippy-map math (`enumerateTiles`,
  `expandTemplate`, a `MAX_TILES` ceiling).
- `src/lib/maps/tile-sources.ts`: resolve the versioned vector template + the
  DEM template.
- `src/lib/maps/download-region.ts`: `regionTileUrls(...)` expands the URLs for a
  box; `downloadTiles(...)` fetches them with bounded concurrency.
- `src/lib/maps/prefetch.ts`: `trailBounds(center)` makes a ~9 km box around a
  trailhead; `prefetchAllTrailAreas(centers)` resolves the sources once and
  fetches every trailhead's box across hiking zoom levels (12-14). A no-op
  offline; gentle (low concurrency, one trail at a time).
- `src/components/offline-tile-prefetch.tsx` (mounted in the root layout, native
  only): on first launch, after the worker is active, prefetches all trailheads
  from `getAllTrails()`. Renders nothing.

No UI, no region index, no management surface, no service-worker message
handler. The website keeps lazy cache-as-you-browse.

## Acceptance criteria (#217 / #244)

1. The map renders and pans offline at any trailhead after one online launch.
2. Trail detail and its map are usable offline.
3. ~~Downloaded areas can be viewed, managed, and cleared.~~ Descoped: caching is
   silent and automatic, so there is no manager.

AC 1 and 2 are verified on device (offline after first open); the prefetch logic
is covered by automated tests.

## Notes

- First launch downloads the tiles for all trails in the background (tens of MB,
  one time). A future refinement could gate the heavier fetching to Wi-Fi.
- The removed explicit-download design (the control, the `offline-regions`
  store including the #236 eviction work, the `tile-cache` bridge, and the
  service-worker clear/delete handler) was deleted with this change.

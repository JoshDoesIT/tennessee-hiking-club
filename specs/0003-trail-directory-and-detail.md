# 0003: Trail directory & detail pages

- **Status:** Approved
- **Milestone:** M4
- **Issue:** TBD

## Problem

Beyond the map, visitors need to browse/filter all trails and see a rich detail
page for each, including the "click it and it takes you there" Google Maps link.

## User stories

- As a visitor, I want to filter trails by region, difficulty, and length.
- As a visitor, I want a trail page with photos, stats, a small map, and a
  directions button.
- As a hiker at the trailhead, I want one tap to open turn-by-turn directions.

## Acceptance criteria

- [ ] `/trails` lists all trails as cards (name, region, difficulty, length,
      thumbnail) and supports filtering by region, difficulty, and length range.
- [ ] Filtering is reflected in the URL (shareable) and works without JS for the
      base list (progressive enhancement).
- [ ] `/trails/[slug]` is statically generated for every trail
      (`generateStaticParams`) with per-trail `generateMetadata` (title, OG).
- [ ] The detail page shows: photo gallery, summary, stats (length, gain,
      difficulty, route type), markdown body, and tags.
- [ ] A small embedded context map (`react-leaflet` + OpenStreetMap, no API key)
      shows the trailhead.
- [ ] An "Open in Google Maps" button uses `googleMapsDirectionsUrl()` from
      `src/lib/maps.ts`; its `href` contains the trail's coordinates.
- [ ] 404 for unknown slugs.

## Non-goals

- Sorting by user ratings; turn-by-turn inside the app (we deep-link out).

## Technical approach

- Server components read trails via the spec-0001 loader. Leaflet map is a
  client component loaded dynamically (`ssr: false`) to avoid SSR `window`.
- Filters via URL `searchParams`.

## Test plan

- Component: filter logic (pure function over trails): Vitest.
- Component: detail renders Google Maps href with correct coords.
- E2E: filter on /trails, open a trail, assert directions link host + coords.

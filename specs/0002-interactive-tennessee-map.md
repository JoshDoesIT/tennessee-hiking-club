# 0002 — Interactive Tennessee map

- **Status:** Approved
- **Milestone:** M3
- **Issue:** TBD

## Problem

The signature experience: a distinctive, badge-styled map of Tennessee (not a
generic slippy map) where every trail is a pin you can click to open its page.

## User stories

- As a visitor, I want to see all trails on a map of Tennessee so I can explore
  by location.
- As a visitor, I want to click/tap a pin and go straight to that trail.
- As a keyboard or screen-reader user, I want to reach and activate pins without
  a mouse.

## Acceptance criteria

- [ ] A `<TennesseeMap>` component renders an SVG outline of Tennessee derived
      from public-domain US Census geometry (`us-atlas`, FIPS 47) projected with
      `d3-geo` (`geoAlbers`/`geoMercator` fit to the state).
- [ ] Each trail renders as a pin at its projected coordinates.
- [ ] Clicking/tapping a pin navigates to `/trails/[slug]`.
- [ ] Pins are keyboard-focusable and activate on Enter/Space; each has an
      accessible name (the trail name).
- [ ] Hover/focus shows a tooltip with the trail name and region.
- [ ] The map is responsive (scales to container) and styled to the brand
      (forest outline, region tints, amber pins).
- [ ] A projection unit test maps a known lat/lng to expected SVG coordinates
      within tolerance.

## Non-goals

- Pan/zoom, clustering, or real basemap tiles (that's the per-trail detail map,
  spec 0003). Offline/tiling concerns do not apply.

## Technical approach

- Precompute/transform the TN TopoJSON at build (script in `scripts/`), output a
  small GeoJSON to `src/lib/geo/tennessee.ts` so the client bundle stays light.
- Pure SVG + React; no map library needed. Projection helpers in
  `src/lib/geo/projection.ts` (unit-testable, pure functions).

## Test plan

- Unit: projection function (lat/lng → [x,y]) is deterministic and correct.
- Component: renders one pin per trail; pin has correct `href`/role/name; Enter
  triggers navigation (Vitest + Testing Library).
- E2E: clicking a pin lands on the right trail page (Playwright).

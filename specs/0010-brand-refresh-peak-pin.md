# 0010: Brand refresh — "Peak + Pin" (Concept 5)

- **Status:** Draft
- **Milestone:** TBD
- **Issue:** TBD

## Problem

The club adopted a new identity from the brand exploration sheet: **Concept 5,
"Peak + Pin"** — a map-pin mark containing twin mountain peaks, the
**TN HIKING CLUB** wordmark with the tagline **EXPLORE TENNESSEE TOGETHER**,
and a deep-pine app icon. The current site still ships the vintage badge
brand (cream paper, amber sun, circular TNHC badge). The site needs to move
to the new identity coherently: tokens, logo, icons, chrome, and the landing
experience — modern, deliberate, and animated with restraint and purpose.

## Direction

Where the badge brand was _vintage heritage_ (hand-screened poster), Peak +
Pin is **modern trail-marker**: cool stone ground, deep pine ink, a single
vivid Tennessee-orange accent, and motion language built around the pin
itself — the mark _drops_ like a map pin and _pings_ like a located trailhead.

## Palette (from the brand sheet)

| Role                      | Name         | Hex       |
| ------------------------- | ------------ | --------- |
| Darkest ground / headings | Deep Pine    | `#15352A` |
| Primary green             | Forest Green | `#1E4D3A` |
| Mid green                 | Sage         | `#8BA888` |
| Borders / fills           | Mist         | `#C7D2C1` |
| Accent                    | TN Orange    | `#F47C20` |
| Page background           | Stone        | `#F5F6F3` |

Existing token _names_ (`forest`, `pine`, `sage`, `sage-100`, `cream`,
`amber`, …) are re-valued rather than renamed, so the entire app shifts to
the new palette without touching every component; canonical Concept-5 aliases
(`deep-pine`, `mist`, `stone`, `tn-orange`) are added for new code. Dark mode
is re-derived from Deep Pine night values; the day/night model is unchanged.

## Acceptance criteria

- [ ] `globals.css` `@theme` carries the six Concept-5 hexes above (as
      re-valued legacy tokens + new aliases), with a re-derived `.dark`
      palette and `night-panel` block. (test: `src/app/globals.test.ts`)
- [ ] AA contrast holds: body ink on stone ≥ 7:1; accent-as-text uses a
      darkened orange (`amber-700`) ≥ 4.5:1 on stone; orange is otherwise a
      fill with deep-pine label.
- [ ] `Logo` renders the Peak + Pin mark as **inline SVG** (no PNG request),
      with the `TN HIKING CLUB` wordmark and `EXPLORE TENNESSEE TOGETHER`
      tagline, `tone="dark" | "light"`, mark-only mode, and an accessible
      name. The mark is exported (`PeakPinMark`) for reuse (hero, map, icons).
      (test: `src/components/logo.test.tsx`)
- [ ] Brand assets are **generated from the same SVG source** by
      `scripts/build-brand-assets.mjs` (sharp): `public/logo.png` (1024,
      transparent), `src/app/icon.png` (512, deep-pine rounded tile),
      `src/app/apple-icon.png` (180, full-bleed tile), `src/app/favicon.ico`
      (16/32/48 PNG-compressed ICO), `public/opengraph-image.png` +
      `public/twitter-image.png` (1200×630, mark-led composition — no
      rasterized wordmark text, so no font substitution).
- [ ] Motion is rebuilt around the mark, deliberate and reduced-motion-safe: - `pin-drop`: the mark drops in with a soft overshoot (hero, 1×). - `pin-ping`: a radar ripple emitted from the pin tip after landing. - scroll reveals: content sections rise in once, staggered, via a
      `Reveal` component (IntersectionObserver; SSR-safe; no-ops under
      reduced motion). - hero ridgeline parallax via CSS scroll-driven animations behind an
      `@supports (animation-timeline: scroll())` guard (graceful no-op). - All of it inert under `prefers-reduced-motion` (existing global rule).
- [ ] `Ridgeline` and `SkyBackdrop` recolored to the new palette (mist → sage
      → forest → deep pine; sun warms to TN orange).
- [ ] Header/footer/landing use the new lockup; the landing hero leads with
      the animated mark; the tagline appears as a slow marquee divider band
      (paused under reduced motion).
- [ ] `docs/brand/BRAND.md` is rewritten for the new identity (palette,
      logo files, usage, motion language), with the legacy-token mapping
      documented.
- [ ] `pnpm test`, `typecheck`, `lint`, and `build` pass.

## Non-goals

- Native app icons (`android/`, `ios/`) and store assets — follow-up.
- Renaming token utilities across the codebase (`bg-cream` etc. keep working).
- A PR; this ships as a draft on the feature branch for review.

## Test plan

- Unit: token hexes + keyframes present in `globals.css`; `Logo` renders SVG
  mark, wordmark, tagline, tones, accessible name; `Reveal` toggles its
  revealed state when intersecting (jsdom IO stub).
- Manual: light/dark on landing, header, footer; reduced-motion spot check.

# Tennessee Hiking Club: Brand Guidelines

Our brand is **modern trail-marker**: the clarity of a well-placed blaze and
the confidence of a located trailhead. Cool stone ground, deep pine ink, one
vivid Tennessee-orange accent, and a mark that behaves like what it is — a
map pin that drops, lands, and pings. (Identity: brand exploration
**Concept 5, "Peak + Pin"**; implementation spec: `specs/0010`.)

---

## 1. Logo

The mark is a **map pin whose ring head holds a mountain scene** — faceted
peaks rising behind a rolling foothill that fuses into the pin's solid tail.
"A trail, located."

- **Lockup:** mark + **TN HIKING CLUB** wordmark (Hanken Grotesk ExtraBold,
  uppercase) over the tagline **EXPLORE TENNESSEE TOGETHER** flanked by two
  short TN-orange rules.
- **Tile:** the mark in stone on a deep-pine rounded square (app icon,
  favicon, social avatar).

### Source of truth

The geometry lives **in code**: the path constants in
`src/components/logo.tsx` (the `PeakPinMark` and `Logo` components). Every
raster below is generated from that geometry by
`node scripts/build-brand-assets.mjs` — never hand-edit the PNGs. (Final
master artwork from the designer can replace the paths in one place when it
arrives.)

| File                                               | Use                                                        |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `src/components/logo.tsx`                          | The mark + lockup as inline SVG. Use this in-app, always.  |
| `public/logo.png`                                  | Mark, 1024×1024, transparent. Docs/readme/external embeds. |
| `src/app/icon.png`                                 | App icon (512): stone mark on a deep-pine rounded tile.    |
| `src/app/favicon.ico`                              | Legacy multi-size favicon (16/32/48).                      |
| `src/app/apple-icon.png`                           | Apple touch icon (180, full-bleed deep-pine tile).         |
| `public/opengraph-image.png` / `twitter-image.png` | 1200×630 share card (mark-led; no rasterized type).        |
| `docs/brand/assets/peak-pin-mono-forest.png`       | Monochrome (forest green) for light single-color contexts. |
| `docs/brand/assets/peak-pin-mono-stone.png`        | Monochrome (stone) for dark single-color contexts.         |
| `docs/brand/assets/logo-original.png`              | Retired badge-era master, kept for history; do not use.    |

### Usage rules

- **Clear space:** at least 25% of the pin height on all sides.
- **Minimum size:** 16 px for the tile, 24 px for the bare mark, 120 px for
  the full lockup with tagline (drop the tagline below that).
- **Color:** the mark is one color — deep pine on light, stone on dark. The
  orange belongs to the tagline rules, pings, and CTAs, not the pin itself.
- **Don't:** outline the mark, rotate or skew the pin, place the deep-pine
  mark on forest green, or pair the mark with the old circular badge.

---

## 2. Color palette

Verbatim from the Concept 5 brand sheet. Defined as Tailwind v4 tokens in
`src/app/globals.css` (`@theme`); use the utility classes, never raw hex, in
app code.

| Role            | Name         | Hex       | Canonical utility | Legacy utility (re-valued) |
| --------------- | ------------ | --------- | ----------------- | -------------------------- |
| Darkest ground  | Deep Pine    | `#15352A` | `deep-pine`       | `forest`                   |
| Primary green   | Forest Green | `#1E4D3A` | `forest-green`    | `pine`                     |
| Mid green       | Sage         | `#8BA888` | —                 | `sage`                     |
| Borders / fills | Mist         | `#C7D2C1` | `mist`            | `sage-100`                 |
| Accent          | TN Orange    | `#F47C20` | `tn-orange`       | `amber`                    |
| Page background | Stone        | `#F5F6F3` | `stone`           | `cream`                    |

Derived working shades: `cream-50 #FCFDFB` (cards), `parchment #E8EDE7`
(section bands), `olive #5C7567` (muted labels), `amber-600 #D96510` (orange
hover), `amber-700 #A14A08` (AA-safe orange text on stone), `ink #22332B`
(body copy).

> **Why two names?** The codebase predates the rebrand; the legacy token
> _names_ (`bg-cream`, `text-forest`, …) were re-valued so the entire app
> wears Concept 5 without a rename sweep. New code should prefer the
> canonical names. Dark mode re-values the same tokens to a deep-pine night
> (see `.dark` in `globals.css`); panels that must stay dark by design use
> `night-panel`.

### Contrast & accessibility (WCAG)

- `ink`/`deep-pine` on `stone` → ≥ 12:1. AA & AAA for body text.
- `stone`/`mist` on `deep-pine` → high contrast for dark sections/footer.
- **TN orange is a fill, not a text color on light:** `#F47C20` fails as text
  on stone. Use it as a surface (with deep-pine label) or use `amber-700`
  (`#A14A08`, ≥ 4.5:1) for orange _text_ like eyebrows.

---

## 3. Typography

| Role               | Typeface                                | Where                            |
| ------------------ | --------------------------------------- | -------------------------------- |
| Wordmark / lockup  | **Hanken Grotesk** ExtraBold, uppercase | The logo lockup only             |
| Display / headings | **Fraunces** (variable, optical sizing) | `h1`–`h3`, hero, section titles  |
| Body / UI          | **Hanken Grotesk**                      | Paragraphs, nav, buttons, labels |

Loaded via `next/font` (self-hosted, no layout shift). Helper classes in
`globals.css`: `.display` (Fraunces, `SOFT 40`, tight tracking) and
`.eyebrow` (uppercase, `0.24em` tracking — pair with `text-amber-700`).

Never substitute generic system fonts for Fraunces or Hanken Grotesk; brand
rasters avoid the problem by being type-free.

---

## 4. Voice & tone

Unchanged by the rebrand: warm, knowledgeable, and welcoming — a friend who
knows the trails, not a guidebook. Adventurous but never reckless; we always
champion **Leave No Trace**. Use "the Volunteer State" and "Grand Divisions"
naturally. No hype, no gatekeeping, no exclamation spam. The tagline is
**Explore Tennessee Together** — set it in uppercase with the orange rules,
or write it as a sentence in copy, but don't reword it.

---

## 5. Imagery

- Real Tennessee landscape photography: golden-hour ridgelines, waterfalls,
  forest trails. Earthy, natural color; avoid heavy saturation/cool filters.
- Decorative **layered ridgelines** (`src/components/ridgeline.tsx`, in mist
  → sage → forest green → deep pine) and faint **topographic contours** (the
  `body::after` texture) are the recurring motifs; reuse them rather than
  inventing new illustration styles.
- Trail photos: horizontal, ≥1200px wide, compressed before commit.

---

## 6. UI components

Reusable primitives live in `src/components/ui` (`Button`/`buttonVariants`,
`Badge`, `Card`, `Container`), cva-based and brand-themed.

- **Primary button:** `bg-forest text-cream` (deep pine / stone), rounded
  full, hover `bg-pine` (forest green).
- **Accent button:** `bg-amber text-forest` (TN orange / deep pine), hover
  `bg-amber-600`.
- **Secondary/ghost:** `border-forest/25 text-forest`, hover `bg-forest/5`.
- **Cards:** `bg-cream-50`, `border-forest/10`, `rounded-2xl`, subtle lift.
- **Map pins:** the brand mark _is_ a pin — orange fill, deep-pine stroke
  for default; deep-pine fill when selected. 44px tap target.
- **Focus:** 2px `amber-600` outline, 2px offset (global).

---

## 7. Motion

Deliberate, one idea per surface, built around the pin (tokens in
`globals.css`, spec 0010):

- **`animate-pin-drop`** — the mark falls and settles with one soft
  overshoot. The hero plays it once; never loop it.
- **`animate-pin-ping`** — a radar ripple from the pin tip after landing
  ("trailhead located"). At most two staggered ripples.
- **`Reveal`** (`src/components/reveal.tsx`) — one-shot scroll entrances,
  staggered ≤ 120ms apart. Content is never hidden from no-JS visitors.
- **Marquee tagline band** — slow (≥ 30s/loop), pauses on hover.
- **Ridgeline parallax** — scroll-driven drift behind an `@supports
(animation-timeline: scroll())` guard; a static scene elsewhere.
- Everything is inert under `prefers-reduced-motion` (global rule). Keep
  interactive transitions ≤ 200ms.

---

_Tokens live in `src/app/globals.css`. If the mark's geometry changes, edit
`src/components/logo.tsx`, re-run `node scripts/build-brand-assets.mjs`, and
update this document together._

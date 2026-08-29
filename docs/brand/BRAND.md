# Tennessee Hiking Club — Brand Guidelines

The visual identity comes from the official Tennessee Hiking Club brand kit.
The kit's reference files are versioned alongside this document:

- [`color_palette.csv`](./color_palette.csv) — the seven core colors
- [`logo_usage.md`](./logo_usage.md) — logo rules from the kit
- [`typography.md`](./typography.md) — type rules from the kit
- [`brand_voice_and_bios.md`](./brand_voice_and_bios.md) — voice, taglines, bios

**The kit is the source of truth.** When it changes, update the `@theme`
block in `src/app/globals.css`, the derived values below, and this file
together.

## Logo

A circular raster badge: a hiker silhouetted on a summit above layered
mountain ridges and evergreens, "TENNESSEE" in distressed cream capitals,
"HIKING CLUB" in moss green, and the Tennessee tri-star at the base.

| File                                                                | Use                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `docs/brand/assets/logo-original.png`                               | Archival master (2048px, from the kit)                         |
| `public/logo.png`                                                   | In-product badge (1024px, transparent)                         |
| `src/app/icon.png`, `src/app/favicon.ico`, `src/app/apple-icon.png` | Favicons / touch icon                                          |
| `public/icons/*`                                                    | PWA + manifest icons (android-chrome, maskable, favicon sizes) |
| `public/opengraph-image.png`, `public/twitter-image.png`            | Link previews (kit OG art, flattened)                          |
| `assets/logo.png`                                                   | Native app icon source (kit `app_icon_1024`)                   |

Usage rules (from the kit's `logo_usage.md`):

- Keep ≥ 8% of the badge diameter as clear space; ≥ 160px wide in normal
  layouts, the prepared 64–128px exports for small placements.
- Keep the badge circular and proportional; never stretch, skew, rotate,
  crop, recolor, re-type the lettering, or add shadows/glows/filters.
- The artwork is **raster only** — there is no vector master. Use the
  prepared exports rather than re-saving the archival master.
- Standard alt text: _"Tennessee Hiking Club circular logo showing a hiker
  on a mountain summit above layered mountain ridges and pine trees."_

The horizontal lockup is the `Logo` component (`src/components/logo.tsx`):
badge + "Tennessee" in the display face with "HIKING CLUB" in moss beneath.

## Color

Utilities come from the `@theme` tokens in `src/app/globals.css` — use
`bg-forest`, `text-moss-700`, etc., never raw hex in components.

### Kit colors → tokens (light)

| Kit name      | Hex       | Token               | Role                                               |
| ------------- | --------- | ------------------- | -------------------------------------------------- |
| Evergreen     | `#151F0A` | `forest`, `ink`     | Primary dark, headings, body text, primary buttons |
| Trail Cream   | `#F9F3D5` | `cream`             | Page background, text on dark                      |
| Rock Olive    | `#465139` | `pine`              | Secondary green, hover of primary                  |
| Mountain Teal | `#375E62` | `teal`              | Info accents, focus ring, water features           |
| Ridge Sage    | `#66867F` | — (decorative only) | Ridgeline art, summit markers                      |
| Mist Sage     | `#ACBFA5` | `sage`              | Decorative fills                                   |
| Moss Accent   | `#A2BD77` | `moss`              | Accent CTAs (always with Evergreen text)           |

### Derived values (not in the kit — tints/shades added for contrast and surface steps)

| Token       | Hex       | Derivation     | Why                                                |
| ----------- | --------- | -------------- | -------------------------------------------------- |
| `olive`     | `#526F69` | Ridge Sage 700 | AA text on cream (4.9:1) — raw Ridge Sage is 3.6:1 |
| `sage-100`  | `#CBD7C6` | Mist Sage 100  | Light borders/fills                                |
| `cream-50`  | `#FCF9E8` | Trail Cream +L | Raised cards                                       |
| `parchment` | `#EDE5C0` | Trail Cream −L | Map land, sunken surfaces                          |
| `moss-600`  | `#8CA65E` | Moss −L        | Hover fills                                        |
| `moss-700`  | `#556B2F` | Moss dark      | AA moss text on cream (5.3:1)                      |

### Accessibility

- Evergreen on Trail Cream ≈ **15.3:1** (AAA both directions).
- Moss carries Evergreen text (8.2:1). **Moss is never a text color on
  light** (1.9:1) — use `moss-700`.
- Teal on cream = 6.4:1 — the AA link/info accent and the focus ring.
- `ink` equals `forest` in light mode but they **diverge in dark mode** —
  don't deduplicate the tokens.

### Dark mode

`.dark` re-values the same token names (see `globals.css`): near-black
Evergreen ground `#0E1506`, dimmed Trail Cream ink `#EFE9CD` (15.3:1),
lightened moss/teal/sages — every text token ≥ 4.5:1 on both the ground
and raised cards. `.night-panel` restores the light values inside surfaces
designed as dark panels (footer, mission bands, map tooltips).

## Typography

- **Display / headings:** Oswald SemiBold via `next/font`
  (`--font-display`, the `.display` helper: weight 600, letter-spacing
  0.02em). Fallbacks: Impact, Arial Narrow.
- **Body / UI:** Inter via `next/font` (`--font-sans`). Fallbacks: Arial,
  Helvetica. Body 16–18px at 1.5–1.7 line-height; buttons and labels Inter
  SemiBold 14–16px.
- Type scale: hero `text-5xl`→`text-7xl`, section `text-3xl`→`4xl`, cards
  `text-xl`→`2xl`, body `text-base`→`lg`, `.eyebrow` `text-xs` tracked caps.
- Use all-caps sparingly: the club name and short navigation labels only.
- The lettering inside the badge is artwork — never re-type it in a font.

## Voice & tone

The club sounds like an experienced trail friend: welcoming, outdoorsy,
capable, local, practical.

- Lead with the trail, place, or experience; keep logistics clear
  (distance, difficulty, meeting point).
- Welcome every skill level while being specific about difficulty.
- Champion Leave No Trace, respect for wildlife and private property.
- No hype, minimal exclamation points, no gatekeeping.
- Tagline: **"Explore Tennessee. Together."**

## Imagery

Real Tennessee landscape photography — golden-hour, earthy, horizontal,
≥ 1200px. The layered ridgeline (`src/components/ridgeline.tsx`) is the
recurring motif; its ladder mirrors the badge art (Mist Sage → Ridge Sage
→ Mountain Teal → Evergreen).

## UI components

`src/components/ui` cva primitives:

- Primary button: `bg-forest text-cream rounded-full hover:bg-pine`.
- Accent button: `bg-moss text-forest hover:bg-moss-600` (Evergreen label
  in both themes).
- Outline/ghost: `border-forest/25 text-forest`.
- Cards: `bg-cream-50 border-forest/10 rounded-2xl` (kit radii: 8 / 16 /
  pill — `rounded-md` / `rounded-2xl` / `rounded-full`).
- Map pins: moss fills with Evergreen strokes; waterfalls/water in
  Mountain Teal; caution keeps functional red. 44px tap targets.
- Focus: 2px Mountain Teal outline, offset 2.

## Motion

`animate-rise` staggered hero fade-up, `animate-sun` glow, ≤ 200ms
transitions, all guarded by `prefers-reduced-motion`.

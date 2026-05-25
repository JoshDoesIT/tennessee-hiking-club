# Tennessee Hiking Club — Brand Guidelines

Our brand is **vintage heritage outdoors**: the look of a hand-screened
national-park poster or an enamel trail badge. Warm paper, deep forest green,
layered ridgelines, and a single warm accent. Everything should feel earthy,
welcoming, and made for the trail.

---

## 1. Logo

The mark is a circular **badge** containing:

- **TNHC** monogram (the club initials) set in a bold serif.
- A layered **mountain range** with an evergreen forest foreground.
- A warm **setting sun** rising over the ridgeline — our accent color.
- **TENNESSEE HIKING CLUB** curved along the bottom of the ring.

### Files

| File                                  | Use                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `public/logo.png`                     | Primary badge, 1024×1024, **transparent background**. Use everywhere in-app. |
| `src/app/icon.png`                    | Favicon / app icon (512×512), generated from the badge.                      |
| `docs/brand/assets/logo-original.png` | Original master artwork. Source of truth — do not edit in place.             |

The `Logo` React component (`src/components/logo.tsx`) renders the badge with an
optional wordmark and a `tone="light" | "dark"` for placement on dark or light
backgrounds.

### Usage rules

- **Clear space:** keep at least 25% of the badge diameter clear on all sides.
- **Minimum size:** 28 px (favicon) / 32 px (in-product). Below this the curved
  text becomes illegible — use the badge without the wordmark.
- **Backgrounds:** the badge is transparent and reads well on `cream`, `forest`,
  and photography. On busy photos, place it on a solid or lightly scrimmed area.
- **Don't:** recolor it, stretch/skew it, rotate it, add drop shadows beyond the
  subtle built-in one, crop the circle, or place the dark ring on a dark green
  background without sufficient contrast.

> **TODO (M1):** produce dedicated horizontal lockup, single-color (1-color
> forest + 1-color cream) variants, and a proper multi-size `favicon.ico` +
> `apple-touch-icon`. Tracked in the M1 milestone.

---

## 2. Color palette

Sampled directly from the badge. Defined as Tailwind v4 tokens in
`src/app/globals.css` (`@theme`); use the utility classes, never raw hex, in app
code.

| Role               | Hex       | Utility     | Notes                                   |
| ------------------ | --------- | ----------- | --------------------------------------- |
| Forest (primary)   | `#2A3623` | `forest`    | Ring, headings, dark sections, footer   |
| Pine               | `#475036` | `pine`      | Hover/secondary green                   |
| Olive              | `#6C724A` | `olive`     | Foreground foliage, muted labels        |
| Sage               | `#959760` | `sage`      | Mid mountains, secondary text on dark   |
| Light sage         | `#C6C680` | `sage-100`  | Borders, far ridges, fills              |
| Cream (background) | `#FBF6E9` | `cream`     | Page "paper" background                 |
| Cream-50           | `#FEFCF5` | `cream-50`  | Cards, raised surfaces                  |
| Parchment          | `#F1E9D6` | `parchment` | Alternating section bands               |
| Amber (accent)     | `#E0A24C` | `amber`     | The sun, primary CTAs, highlights       |
| Amber-600          | `#C8852F` | `amber-600` | Amber hover, eyebrow labels, focus ring |
| Ink (text)         | `#1E2419` | `ink`       | Body copy                               |

### Contrast & accessibility (WCAG)

- `ink`/`forest` on `cream` → ~11:1. ✅ Passes AA & AAA for body text.
- `cream`/`sage-100` on `forest` → high contrast. ✅ Use for footer/dark sections.
- `amber` on `forest` → ~5:1. ✅ AA for normal text; used for CTA fills.
- **`amber` is an accent, not a text color on light** — it fails contrast as text
  on `cream`. Use it as a fill (with `forest` text) or a small highlight only.

---

## 3. Typography

A characterful display serif paired with a warm, modern sans. Loaded via
`next/font` (self-hosted, no layout shift).

| Role               | Typeface                                | Where                            |
| ------------------ | --------------------------------------- | -------------------------------- |
| Display / headings | **Fraunces** (variable, optical sizing) | `h1`–`h3`, hero, section titles  |
| Body / UI          | **Hanken Grotesk**                      | Paragraphs, nav, buttons, labels |

Helper classes in `globals.css`:

- `.display` — applies Fraunces, optical sizing, `SOFT 40`, tight tracking. Put
  it on every display heading.
- `.eyebrow` — uppercase, `0.24em` tracking, 600 weight — the "trail-sign" label
  above section titles. Pair with `text-amber-600`.

**Type scale (Tailwind):** hero `text-5xl`→`text-7xl`; section titles
`text-3xl`→`text-4xl`; card titles `text-xl`→`text-2xl`; body `text-base`→
`text-lg`; eyebrow `text-xs`.

Never substitute generic system fonts (Inter, Arial, Roboto) for the display
face — the Fraunces character is core to the brand.

---

## 4. Voice & tone

Warm, knowledgeable, and welcoming — a friend who knows the trails, not a
guidebook. Adventurous but never reckless; we always champion **Leave No Trace**.

- **Do:** "Discover the Volunteer State's best trails." "Pack it in, pack it out."
- **Don't:** hype ("EPIC!!!"), gatekeeping, or jargon. No exclamation spam.
- Use "the Volunteer State" and "Grand Divisions" naturally — it's local pride.

---

## 5. Imagery

- Real Tennessee landscape photography: golden-hour ridgelines, waterfalls,
  forest trails. Earthy, natural color — avoid heavy saturation or cool filters.
- Decorative **layered ridgelines** (see `src/components/ridgeline.tsx`) are a
  recurring motif; reuse them rather than inventing new illustration styles.
- Trail photos should be horizontal, ≥1200px wide, and compressed (see
  CONTRIBUTING.md) before commit.

---

## 6. UI components

- **Primary button:** `bg-forest text-cream`, fully rounded (`rounded-full`),
  hover `bg-pine`. **Accent button:** `bg-amber text-forest`, hover `bg-amber-600`.
- **Secondary/ghost button:** `border border-forest/25 text-forest`, hover
  `bg-forest/5`.
- **Cards:** `bg-cream-50`, `border-forest/10`, `rounded-2xl`, subtle hover lift.
- **Map pins (M3):** amber fill with forest stroke for default; forest fill for
  selected. Sized for a comfortable 44px tap target.
- **Focus:** 2px `amber-600` outline, 2px offset (global in `globals.css`).

---

## 7. Motion

Restrained and earthy. One orchestrated entrance beats scattered effects.

- `animate-rise` — staggered fade-up for hero elements (use `animationDelay`).
- `animate-sun` — slow glow/pulse on the setting sun.
- All motion respects `prefers-reduced-motion` (handled globally). Keep
  transitions ≤ 200ms for interactive states.

---

_Tokens live in `src/app/globals.css`. When the logo changes, re-sample the
palette and update both this document and the `@theme` block together._

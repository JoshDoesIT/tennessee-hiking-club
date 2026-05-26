<div align="center">

<img src="public/logo.png" alt="Tennessee Hiking Club" width="140" />

# Tennessee Hiking Club

**Discover the Volunteer State's best trails on an interactive map: photos, coordinates, and one-tap directions to the trailhead.**

[![CI](https://github.com/JoshDoesIT/tennessee-hiking-club/actions/workflows/ci.yml/badge.svg)](https://github.com/JoshDoesIT/tennessee-hiking-club/actions/workflows/ci.yml)
[![CodeQL](https://github.com/JoshDoesIT/tennessee-hiking-club/actions/workflows/codeql.yml/badge.svg)](https://github.com/JoshDoesIT/tennessee-hiking-club/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2A3623.svg)](LICENSE)

</div>

---

A free, open-source, community project mapping Tennessee's trails, from the high
balds of the Smokies to the waterfalls of the Cumberland Plateau and the quiet
bottomlands of West Tennessee. Built with Next.js and hosted on Vercel's free
tier.

## Features

- **Stylized, interactive Tennessee map** with a pin for every trail
- **Trail directory**: filter by region, difficulty, and length
- **Rich trail pages**: photos, stats, coordinates, and a context map
- **One-tap directions** straight to Google Maps
- **Merch shop** (coming soon): print-on-demand, to help fund the project
- Accessible, responsive, and fast

## Tech stack

|           |                                                                          |
| --------- | ------------------------------------------------------------------------ |
| Framework | [Next.js](https://nextjs.org) (App Router) + React + TypeScript          |
| Styling   | Tailwind CSS v4 · Fraunces + Hanken Grotesk (`next/font`)                |
| Map       | `d3-geo` (stylized state map) · `react-leaflet` + OpenStreetMap (detail) |
| Content   | Markdown + front-matter, validated by Zod                                |
| Store     | Stripe Checkout + print-on-demand (Printful/Printify)                    |
| Testing   | Vitest + Testing Library · Playwright (E2E)                              |
| Hosting   | Vercel (Hobby/free tier)                                                 |

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build
pnpm test         # unit/component tests (Vitest)
pnpm test:e2e     # end-to-end tests (Playwright)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm format       # prettier --write
```

> Requires Node ≥ 20.9 and pnpm (run `corepack enable`). See `.nvmrc`.

## Project structure

```
src/app/            # routes (App Router)
src/components/      # shared UI (header, footer, logo, ridgeline…)
src/lib/            # utilities (maps, trails loader, geo)
content/trails/     # trail data: Markdown + front-matter (add yours here!)
specs/              # feature specifications (spec-driven development)
docs/brand/         # brand guidelines + logo source
e2e/                # Playwright tests
```

## Contributing

We'd love your help, especially **adding trails**. See
[CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md). This project uses **spec-driven** and
**test-driven** development; specs live in [`specs/`](specs/).

To suggest a trail without writing code, open a
[New trail issue](https://github.com/JoshDoesIT/tennessee-hiking-club/issues/new?template=new_trail.yml).

## Roadmap

Tracked in [GitHub Milestones & Issues](https://github.com/JoshDoesIT/tennessee-hiking-club/milestones).

1. **M0–M1** Foundation, brand & design system
2. **M2** Trail data model & content
3. **M3** Interactive Tennessee map
4. **M4** Trail directory & detail pages
5. **M5–M6** Polish & **v1 launch**
6. **M7–M9** Merch store & growth

## Contributors

A community project, built in the open. Thanks to everyone who adds trails,
fixes details, and helps make the map more complete.

- [@JoshDoesIT](https://github.com/JoshDoesIT) (maintainer)

The best first contribution is a trail. Browse the
[trail wishlist](https://github.com/JoshDoesIT/tennessee-hiking-club/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22+label%3Atrail)
(issues labeled `good first issue` and `trail`), or open a
[New trail issue](https://github.com/JoshDoesIT/tennessee-hiking-club/issues/new?template=new_trail.yml).
Open a pull request and we will add you here.

## License

[MIT](LICENSE) © Joshua Jones and Tennessee Hiking Club contributors.

_Hike responsibly · Leave No Trace · Built in the open._

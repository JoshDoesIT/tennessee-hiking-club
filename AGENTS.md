<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Tennessee Hiking Club: agent & contributor notes

Conventions for humans and AI assistants working in this repo.

## Stack

- Next.js (App Router) + React + TypeScript (strict), Tailwind CSS v4, pnpm.
- Fonts: Fraunces (display) + Hanken Grotesk (body) via `next/font`.
- Map: `d3-geo` (stylized TN map), `react-leaflet` + OpenStreetMap (detail map),
  and Google Maps deep links (`src/lib/maps.ts`) for directions.
- Content: Markdown + front-matter in `content/trails/`, validated by Zod.
- Tests: Vitest + Testing Library (unit/component), Playwright (e2e).

## Commands

- `pnpm dev` | `build` | `start`
- `pnpm test` | `test:e2e` | `typecheck` | `lint` | `format`

## How we work (important)

- **Spec-driven:** write or read the relevant spec in `specs/` before starting a
  non-trivial feature.
- **Test-driven:** write failing tests first, then implement the minimum to pass.
  Do not claim TDD if tests were written after the code.
- Use **brand tokens** (`bg-forest`, `text-amber`, …) from `src/app/globals.css`,
  never raw hex in components. See `docs/brand/BRAND.md`.
- Accessibility and responsiveness are required, not optional.
- Conventional Commits; reference issues; keep PRs focused (see `CONTRIBUTING.md`).

## Project map

- `src/app`: routes · `src/components`: shared UI · `src/lib`: pure utilities.
- `content/trails`: trail data · `specs`: feature specs · `docs/brand`: brand.

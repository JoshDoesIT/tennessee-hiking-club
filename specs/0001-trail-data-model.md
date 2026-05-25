# 0001 — Trail data model & content pipeline

- **Status:** Approved
- **Milestone:** M2
- **Issue:** TBD

## Problem

Trails are the core content of the site. We need a typed, validated, version-
controlled data model that (a) renders the map and trail pages, (b) lets anyone
contribute a trail via a reviewed pull request, and (c) cannot silently drift —
bad data should fail the build, not ship.

## User stories

- As a visitor, I want accurate, consistent trail info (location, distance,
  difficulty) so I can decide where to hike.
- As a contributor, I want to add a trail by creating one simple file, so the
  barrier to contributing is low.
- As a maintainer, I want invalid trail data to fail CI, so the site never ships
  broken content.

## Acceptance criteria

- [ ] A Zod schema `trailSchema` (in `src/lib/trails/schema.ts`) defines and
      validates every field (see shape below). It is the executable spec.
- [ ] Each trail is one Markdown file with front-matter in `content/trails/`.
- [ ] `getAllTrails()` returns all trails, validated, sorted by name.
- [ ] `getTrailBySlug(slug)` returns a single trail or `null`.
- [ ] Loading a file that violates the schema throws a descriptive error naming
      the file and field (verified by a test with a bad fixture).
- [ ] `slug` is unique across all trails (duplicate slugs fail validation).
- [ ] `coordinates` are within Tennessee's bounding box (~lat 34.9–36.7,
      lng −90.4 to −81.6); out-of-state coordinates fail validation.
- [ ] At least 8 real seed trails across all three Grand Divisions are included
      and pass validation.

## Trail shape

```ts
{
  slug: string;                 // kebab-case, unique
  name: string;
  region: "East" | "Middle" | "West";
  area: string;                 // e.g. "Great Smoky Mountains NP"
  coordinates: { lat: number; lng: number }; // trailhead
  lengthMiles: number;
  elevationGainFt: number;
  difficulty: "easy" | "moderate" | "hard" | "strenuous";
  routeType: "loop" | "out-and-back" | "point-to-point";
  dogFriendly?: boolean;
  feeRequired?: boolean;
  tags: string[];               // e.g. ["waterfall", "views"]
  photos: { src: string; alt: string; credit?: string }[];
  externalLinks?: { label: string; url: string }[];
  summary: string;              // one-line
  body: string;                 // markdown description
}
```

## Non-goals

- User-submitted reviews/ratings, GPX track rendering, live trail conditions.
- A database — content stays as files in the repo for this phase.

## Technical approach

- `gray-matter` to parse front-matter; `zod` to validate; a small loader in
  `src/lib/trails/index.ts`. Reuse `src/lib/maps.ts` for the TN bounding box
  check and Google Maps links.
- Photos in `public/trails/<slug>/`; remote URLs allowed with credit.

## Test plan

- Unit: schema accepts a valid fixture; rejects missing/invalid fields, bad
  coordinates, and duplicate slugs (Vitest).
- Unit: loader returns sorted trails, resolves a known slug, and returns `null`
  for a missing slug.

# Contributing to Tennessee Hiking Club

Thanks for helping map the Volunteer State! Whether you're adding a trail, fixing
a bug, or building a feature, this guide will get you started. By participating
you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Add a trail**: the most valuable contribution. See [below](#adding-a-trail).
- **Report a bug** or **request a feature** via the
  [issue templates](https://github.com/JoshDoesIT/tennessee-hiking-club/issues/new/choose).
- **Improve docs**, fix typos, or refine the design.
- **Pick up an issue**: look for `good first issue`.

## Development setup

```bash
corepack enable          # use the pinned pnpm
pnpm install
pnpm dev                 # http://localhost:3000
```

Useful scripts: `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`,
`pnpm format`. Requires Node ≥ 20.9 (see `.nvmrc`).

## How we work: spec-driven + test-driven

This project takes both seriously.

1. **Spec first.** Non-trivial features get a short spec in [`specs/`](specs/)
   with testable **acceptance criteria**. Open or link a GitHub issue.
2. **Test first (TDD).** Write failing tests for each acceptance criterion,
   watch them fail, then implement the minimum to pass. Don't write the
   implementation before the test.
3. **Check off** each acceptance criterion in the issue, citing the file/test
   that satisfies it.
4. **Open a PR** that references the issue (e.g. `Closes #12`).

CI must be green (typecheck, lint, unit tests, build, CodeQL, and E2E) before a
PR can merge.

## Branches & commits

- Branch off `main`: `feat/interactive-map`, `fix/trail-coords`, `docs/readme`.
- Use [Conventional Commits](https://www.conventionalcommits.org): `feat:`,
  `fix:`, `docs:`, `test:`, `chore:`, `refactor:` … Reference issues (`#N`).
- Keep PRs focused and small where possible; fill out the PR template.

## Adding a trail

Two options:

**A. No code (easiest):** open a
[New trail issue](https://github.com/JoshDoesIT/tennessee-hiking-club/issues/new?template=new_trail.yml)
and fill in the form. A maintainer will add it.

**B. Pull request:** create `content/trails/<slug>.md` following the front-matter
shape in [`specs/0001-trail-data-model.md`](specs/0001-trail-data-model.md), e.g.:

```md
---
slug: virgin-falls
name: Virgin Falls
region: Middle
area: Virgin Falls State Natural Area
coordinates: { lat: 35.8267, lng: -85.2861 }
lengthMiles: 8.6
elevationGainFt: 1610
difficulty: strenuous
routeType: out-and-back
tags: [waterfall, backcountry]
photos:
  - {
      src: /trails/virgin-falls/falls.jpg,
      alt: "Virgin Falls",
      credit: "Your Name",
    }
summary: A strenuous trek to a 110-ft waterfall that vanishes into a cave.
---

Full Markdown description of the hike…
```

Guidelines:

- **Accuracy matters.** Coordinates must point to the trailhead/parking and fall
  within Tennessee. The build validates this.
- **Photos:** horizontal, ≥ 1200px wide, compressed, in `public/trails/<slug>/`.
  Only submit photos you have the right to use, and include a `credit`.
- Be honest about difficulty and hazards. Encourage Leave No Trace.
- Run `pnpm validate:content` before opening a PR; it checks every trail file
  against the schema. CI and `pnpm build` run it too, so invalid data can't ship.

### Adding a GPS route (elevation profile + GPX)

A trail can carry an optional ordered `route` of `{ lat, lng, elevationFt }`
points. When present it powers the elevation profile and the "Download GPX"
button; when absent the page simply omits them.

Supply a route from a **real GPS track**, not a hand-drawn guess: an official
park route, or a `.gpx` you recorded or downloaded. Convert it with the importer
and paste the result into the trail's front-matter:

```sh
pnpm import:gpx path/to/track.gpx          # prints the `route:` YAML block
pnpm import:gpx path/to/track.gpx 120       # optional: cap the point count (default 80)
```

The importer converts elevation to feet, downsamples to keep the file small, and
prints the route's **gain and length** so you can sanity-check them against the
trail's stated `elevationGainFt` and `lengthMiles` before committing. Only use a
GPX you have the right to share.

#### Pulling a route from public data (no GPX needed)

For trails on public land, you can pull the path straight from authoritative GIS
instead of supplying a GPX:

```sh
pnpm import:route <trail-slug>                       # auto-match by name near the trailhead
pnpm import:route <trail-slug> --source nps|tdec|osm  # force a source
pnpm import:route <trail-slug> --name "Alum Cave Trail"  # pick the official trail name
pnpm import:route <trail-slug> --ways "River Trail,Ridgetop Trail"  # assemble from named OSM ways
pnpm import:route <trail-slug> --ways "..." --osm-radius 5000        # widen the OSM search (meters)
```

It searches the **NPS** (national parks), **TDEC** (TN State Parks), and
**OpenStreetMap** trail layers near the trailhead, stitches the segments into one
ordered line, samples elevation from USGS 3DEP, and prints the `route:` YAML plus
the matched source, length, and gain. It auto-picks only when a source trail name
matches and the length is plausible; otherwise it lists nearby trails so you can
re-run with `--name`/`--source`. **Verify the printed length/gain against the
trail's stated values before committing.** Attribution: NPS and USGS are public
domain; TDEC is TN open data; OSM requires an "© OpenStreetMap contributors"
credit wherever the route is shown.

Many destination trails (a waterfall, a clifftop overlook) have no single GIS
feature named after the destination, but their path **is** in OpenStreetMap as
named segments. Use `--ways` to assemble the route from the exact segment names,
which you can read off the failed-match list the importer prints, or from
[openstreetmap.org](https://www.openstreetmap.org). For example, Burgess Falls is
`--ways "Upper Trail,River Trail,Ridgetop Trail,Big Falls Trail"`. The segments
are stitched and oriented from the trailhead; pick the ones that form the actual
hike and sanity-check the printed length/gain.

For a hike that follows a long through-trail to a named point (a peak reached via
the Appalachian Trail, say), add `--to "lat,lng"` to clip the stitched line to the
segment between the trailhead and that destination. The trailhead may sit
mid-trail (at a gap), so the clip slices the correct direction and orients from
the trailhead. Charlies Bunion is
`--ways "Appalachian Trail" --to "35.639246,-83.371790" --osm-radius 9000`
(the destination coordinate from USGS GNIS).

When the trail's OSM ways are unnamed or fragmented, route over the whole path
network instead with `--network --to "lat,lng"`: it builds a graph of every
nearby path/footway/track and finds the on-trail route from the trailhead to the
destination (a waterfall or summit node from OSM/GNIS). Add `--snap METERS`
(e.g. 25) to bridge small gaps where adjacent ways don't quite share a node, and
`--loop` for a loop trail (it returns out one way and back another). Fall Creek
Falls is `--network --to "35.66609,-85.35572" --osm-radius 3500 --snap 25`. This
only works where the trail is mapped continuously in OSM.

When even the OSM map is too sparse but the trail is popular, `--traces --to
"lat,lng"` routes through the cloud of **public OSM GPS traces** (real recorded
hikes) between the trailhead and the destination, connecting points within
`--snap METERS` (try 45-70). GPS traces are noisy, so always sanity-check the
printed length/gain and smooth obvious zig-zags before committing. A trail with
no public traces and no continuous OSM map still needs a recorded GPX
(`pnpm import:gpx`).

A wrong stored trailhead coordinate will defeat all of these (the router starts
from an isolated point). If routing fails, first check the `coordinates` against
the parking lot / trailhead in OSM near the actual trail.

#### Discovering waypoints along a route

Once a trail has a `route`, you can pull candidate landmarks (waterfalls,
viewpoints, summits, gaps, springs, campsites, arches) near the line:

```sh
pnpm discover:waypoints <trail-slug>                  # candidates within ~150 m
pnpm discover:waypoints <trail-slug> --buffer 250     # widen the buffer (meters)
pnpm discover:waypoints <trail-slug> --source gnis|nps|osm  # one source only
```

It fetches named features near the route from **USGS GNIS**, **NPS Public POIs**,
and **OpenStreetMap**, keeps only those within the buffer of the route, dedupes
across sources, orders them along the route, and prints a `waypoints:` block (with
a `# source:` note per candidate) for you to review. **Curate before
committing** (drop noise, fix names/types, add descriptions). Attribution: GNIS
and NPS are public domain; OSM requires an "© OpenStreetMap contributors" credit.

## Code style

- TypeScript strict; prefer pure, testable functions in `src/lib`.
- Tailwind utility classes; use brand tokens (`bg-forest`, `text-amber`, …); see
  [`docs/brand/BRAND.md`](docs/brand/BRAND.md). Run `pnpm format` before pushing.
- Accessibility is not optional: semantic HTML, labels, keyboard support,
  sufficient contrast.

## Reporting security issues

Please **do not** open a public issue for vulnerabilities; see
[SECURITY.md](SECURITY.md).

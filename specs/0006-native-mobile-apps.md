# 0006: Native mobile app (Capacitor)

- **Status:** Approved
- **Milestone:** Mobile app
- **Issues:** #202 (spike), #215, #216, #217, #218, #219

## Problem

Tennessee Hiking Club is a Next.js web app. Three things the browser does poorly
on the trail are the reason to go mobile, and all three matter most exactly where
members actually hike:

- **Reliable background GPS recording.** The in-browser recorder (#211) uses
  `watchPosition`, which iOS and Android throttle or stop when the screen sleeps
  or the tab backgrounds. A long hike recorded in a mobile browser drops out.
  This is the main driver.
- **Offline maps.** Cell coverage is poor or absent in the gorges and backcountry
  (the same signal loss that keeps Cummins Falls off public GPS traces). Without
  cached tiles there is no map where it is needed most.
- **Push notifications.** Trail alerts, closures, and condition reports could
  reach members proactively instead of only when they open the site.

Plus a generally smoother on-trail experience: a home-screen icon, full screen,
and a faster map.

## Decision

**Build a Capacitor app now.** Wrap the existing React UI in a native iOS/Android
shell and add native plugins for background geolocation, offline maps, and push.
This reuses the entire web UI and the pure TypeScript core, so it ships in weeks
rather than the months a React Native rewrite would take, and it directly solves
the background-GPS problem that motivates the project.

(An earlier draft of this spec recommended a PWA-first phase. That was wrong for
this product: a PWA cannot do background GPS on iOS, which is the whole point, so
a PWA phase would be a detour. The assessment below still stands; the conclusion
is to go straight to Capacitor.)

## Why Capacitor (not PWA, React Native, or fully native)

Legend: good / possible with effort / poor.

| Criterion                    | PWA                         | Capacitor                       | Expo / RN                   | Fully native         |
| ---------------------------- | --------------------------- | ------------------------------- | --------------------------- | -------------------- |
| Background GPS recording     | no (iOS web has none)       | yes (native plugin, screen-off) | yes (best)                  | yes (best)           |
| Offline map tiles            | yes (service-worker cache)  | yes (cache + native store)      | yes (MapLibre offline)      | yes                  |
| Push notifications           | partial (iOS needs install) | yes (APNs / FCM)                | yes                         | yes                  |
| Code reuse with the web app  | full (same app)             | full (whole web UI reused)      | partial (pure TS core only) | none (algorithms)    |
| Store / maintenance overhead | none (no store)             | two listings, one UI codebase   | two listings + a second UI  | two native codebases |
| Cost                         | ~$0                         | store fees + build pipeline     | high (parallel UI)          | highest              |

- **PWA** cannot record background GPS on iOS. It is out as a primary plan; any
  cheap PWA niceties (installable manifest, a service-worker tile cache) can be
  folded into the Capacitor build rather than shipped as a separate phase.
- **React Native** has the best native feel and background-location story, but it
  reuses only the pure TypeScript core; the entire React DOM + Tailwind UI would
  be rebuilt and then kept at parity forever. Not justified for a maps-and-
  recording utility built by a small team.
- **Fully native** is maximum work, minimum reuse. Overkill.

Capacitor wins because it reuses everything we have built and still gets us native
background GPS, offline storage, and push through plugins.

## Architecture

### Service-worker cached shell (not a static export)

The Capacitor app loads the hosted site (`server.url` in `capacitor.config.ts`)
and a service worker caches the shell, assets, and map tiles, so the app keeps
working offline **after the first online open**. Because the WebView is served
from the hosted origin, relative API calls (`/api/...`) resolve against the
backend automatically. This reuses the entire web app and backend with no static
export and no per-target build.

This fits the existing architecture well:

- **Works offline once cached:** browsing trails (content is Markdown built to
  static pages), the maps (client-rendered) once tiles are cached, and logging and
  recording hikes (the hike log is local-first, stored on the device).
- **Needs the network (hosted backend):** sign-in, hike sync, the leaderboard,
  friends, contributions, and admin. These already gate on a client-side
  `/api/auth/session` check or other fetches, so they degrade gracefully when
  offline and reconcile when back online.

### Why not a fully bundled static export

A static export (`output: export`) bundled into the binary would also work offline
on a truly cold, never-been-online launch. We chose not to do that now: the app
has 21 API route handlers, two dynamic OpenGraph image routes, and a few
server-rendered pages that use `auth()`, none of which a static export supports.
Bundling would mean excluding those from a separate mobile build (or a second
export-only app shell) and a custom build pipeline. The service-worker approach
avoids that refactor entirely; a member opens the app once on a connection before
heading to the trailhead, which the cache then covers. If a never-online cold
launch becomes a real requirement, the static export can be revisited.

### Native plugins

- **Background geolocation** for screen-off recording. Start with the
  `@capacitor-community/background-geolocation` plugin; budget for a paid plugin
  such as TransistorSoft if the free one is unreliable.
- **Push notifications** (Capacitor Push Notifications over APNs / FCM).
- **Offline tiles** via a service-worker / Cache Storage tile cache inside the
  WebView plus a native store for downloaded regions.
- Capacitor core plus App, Splash Screen, and Status Bar for shell polish.

### Reuse map

- **Reused as-is** (the whole UI): all of `src/components` and `src/app`.
- **Reused as-is** (the logic): the pure core in `src/lib/trails/*` and
  `src/lib/hikes/*` (elevation, GPX, downsampling, graph routing, stats,
  challenges) and the local-first hike log. The native recorder feeds the same
  `RecordedTrack` storage the web recorder uses (#210/#211).

## Build plan

Each phase is a tracked issue. The foundation comes first; background GPS, offline
maps, and push build on it; store release is last.

- **Foundation (#215).** Capacitor iOS/Android project that loads the hosted app,
  plus an offline service worker that caches the shell, assets, and tiles.
- **Background GPS recording (#216).** Native background-geolocation plugin feeding
  the existing recorded-track storage; records with the screen off; permission
  handling.
- **Offline maps (#217).** Tile cache plus "download this area"; offline trail and
  map browsing.
- **Push notifications (#218).** APNs / FCM registration, a subscription store, an
  opt-in, and a send path for trail alerts.
- **App store submission and release (#219).** Icons/splash, store listings,
  developer accounts, location and privacy disclosures, review submission, and a
  release pipeline.

## MVP

The minimum lovable mobile app is **Foundation (#215) + Background GPS (#216)**:
an installed app that records a hike reliably with the screen off and saves it to
My Hikes. **Offline maps (#217)** is strongly recommended before a public launch
for a backcountry app. **Push (#218)** can follow. **Store release (#219)** is
required to ship publicly.

## Risks and mitigations

- **Service-worker correctness.** A misconfigured cache serves stale assets or
  breaks updates. Mitigation: precache the build output keyed by build hash,
  runtime-cache tiles and pages with sensible strategies, and verify update and
  offline behavior before relying on it. Affects the web app too, since the same
  service worker makes the site offline-capable.
- **Offline guarantee is "after first open."** A never-been-online cold launch
  shows the fallback page, not the app. Mitigation: acceptable for the use case
  (open once before the trailhead); revisit a bundled static export only if this
  proves to be a real need.
- **Background-geolocation reliability.** The free community plugin can be flaky.
  Mitigation: budget for a paid plugin (e.g. TransistorSoft) if field testing
  shows drops; this is the one feature worth paying for.
- **iOS background location and App Store review.** iOS requires clear usage
  strings and justification for "Always" location, and Apple scrutinizes thin
  WebView wrappers (guideline 4.2). Mitigation: the app provides real native
  function (background recording, offline maps, push), and the location prompt is
  tied to an explicit user action (start recording) with a plain explanation.
- **Privacy disclosures.** Location and account data require App Privacy / Data
  safety labels. Handle in the release phase (#219).
- **Cost.** Apple Developer $99/yr, Google Play $25 once, plus a possible paid
  geolocation plugin. Modest and expected for a real app.

## Acceptance criteria

The spec is satisfied when the phased issues ship. Per-phase criteria live on each
issue; the headline checks are:

- [ ] The app runs on iOS and Android and works offline after the first open via
      a cached shell (#215).
- [ ] A hike records with the screen off and saves to My Hikes like an uploaded
      GPX (#216).
- [ ] Maps and trails are usable offline after downloading a region (#217).
- [ ] Trail alerts deliver as push notifications, with opt-in/out (#218).
- [ ] Both apps are submitted to their stores with complete privacy disclosures
      (#219).

## Non-goals

- A React Native or fully-native rewrite. The web app stays the single source of
  the UI; the mobile app wraps it.
- Replacing or forking the web experience. The site and the app share one
  codebase and one backend.

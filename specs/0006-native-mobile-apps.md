# 0006: Native mobile apps (research spike)

- **Status:** Draft
- **Milestone:** Research spike (no build milestone yet)
- **Issue:** #202

## Problem

Tennessee Hiking Club is a Next.js web app. Three things the browser does poorly
on the trail keep coming up, and all three matter most exactly where members
actually hike:

- **Reliable background GPS recording.** The in-browser recorder (#211) uses
  `watchPosition`, which iOS and Android throttle or stop when the screen sleeps
  or the tab backgrounds. A long hike recorded in a mobile browser drops out.
- **Offline maps.** Cell coverage is poor or absent in the gorges and backcountry
  (the same signal loss that keeps Cummins Falls off public GPS traces). Without
  cached tiles there is no map where it is needed most.
- **Push notifications.** Trail alerts, closures, and condition reports could
  reach members proactively instead of only when they open the site.

Plus a generally smoother on-trail experience: a home-screen icon, full screen,
and a faster map. This is a **go / no-go research spike**: decide whether and how
to go mobile, not to build it.

## Decision summary

**GO on a PWA now. Conditional GO on a Capacitor shell later**, gated on evidence
that background GPS recording is a real member need. **Defer React Native and
fully-native.** Rationale below.

## What a mobile app has to improve

In priority order, since the options trade off against exactly these:

1. Background GPS recording that survives a screen-off hike (the #201 gap).
2. Offline map tiles with no signal.
3. Push for alerts, closures, and conditions.
4. Smoother on-trail UX (install, full screen, fast map).

## Options

Cheapest to most involved, matching the issue:

1. **PWA**: installable web app, service worker, offline tile cache, Web Push.
2. **Capacitor**: wrap the existing hosted Next.js/React UI in a native shell and
   add native plugins for background geolocation and push.
3. **Expo / React Native**: shared TypeScript core, native UI rebuilt in RN.
4. **Fully native** (Swift / Kotlin): most work, least reuse.

## Assessment

Legend: ✅ good · ⚠️ possible with effort / caveats · ❌ poor.

| Criterion                    | PWA                                                         | Capacitor                                    | Expo / RN                            | Fully native            |
| ---------------------------- | ----------------------------------------------------------- | -------------------------------------------- | ------------------------------------ | ----------------------- |
| Background GPS recording     | ❌ iOS web has no background geolocation; Android throttles | ✅ native plugin keeps recording screen-off  | ✅✅ best (background tasks)         | ✅✅ best               |
| Offline map tiles            | ✅ service-worker tile cache                                | ⚠️ WebView map needs native/SW caching       | ✅ MapLibre offline regions          | ✅                      |
| Push notifications           | ⚠️ Android yes; iOS only for an installed PWA (16.4+)       | ✅ APNs / FCM                                | ✅ APNs / FCM                        | ✅                      |
| Code reuse with the web app  | ✅✅ 100% (same app + manifest + SW)                        | ✅ whole web UI reused in a WebView          | ⚠️ pure TS core only; UI rebuilt     | ❌ algorithms only      |
| Store / maintenance overhead | ✅ none (no store)                                          | ⚠️ two store listings, review, native builds | ⚠️ two store listings + a second app | ❌ two native codebases |
| Cost                         | ✅ ~$0                                                      | ⚠️ $99/yr Apple + $25 Google + pipeline      | ❌ high (parallel UI)                | ❌ highest              |

### PWA

The same web app plus a `manifest.webmanifest`, a service worker, and icons.
Offline tiles are practical: a service worker can runtime-cache MapLibre tiles
(stale-while-revalidate) and a "download this area" action can pre-fetch a
bounding box into the Cache Storage. Web Push works on Android and, since iOS
16.4, on **home-screen-installed** PWAs. The hard limit is background GPS: iOS
gives web apps no background location at all, and Android browsers suspend
backgrounded tabs, so a screen-off hike still drops. PWA fixes 2, 3, and 4 of the
four drivers at essentially zero cost and full reuse, and leaves driver 1 open.

### Capacitor

Capacitor wraps a web app in a native WebView and exposes native plugins. Because
this app is Next.js App Router with server components and API routes (auth, hike
sync, OG images), a static `output: export` bundle is **not** viable; the
Capacitor app would load the **hosted** site (`server.url`) and layer native
plugins on top. That keeps 100% of the existing UI and server while adding a
native **background-geolocation** plugin (e.g. `@capacitor-community/
background-geolocation`, or a commercial option such as TransistorSoft if the
free plugin proves unreliable) and native **push**. It is the surgical fix for
the one thing a PWA cannot do, without rebuilding any UI. The cost is two store
listings, app review, and a native build/release pipeline.

### Expo / React Native

Best native feel and the strongest background-location story (`expo-location` +
`TaskManager`). But it reuses only the **pure TypeScript core** (see "Code reuse"
below); the entire React DOM + Tailwind UI must be rebuilt in RN primitives,
creating a second front end to keep at parity. Not justified by the marginal
gain over a Capacitor shell for a volunteer hiking-club app.

### Fully native

Maximum platform integration, minimum reuse (only the algorithms port), and two
native codebases. Overkill here.

## Recommendation: a phased path

- **Phase 0: PWA (GO now).** Manifest + icons + service worker, offline tile
  caching for a chosen region, installability, and an offline fallback. This
  delivers offline maps, install, and full screen immediately at ~$0, reusing
  everything. Web Push follows as Phase 0b (it needs VAPID keys and a
  subscription store, so it is a small backend addition rather than pure
  front-end).
- **Phase 1: Capacitor shell (CONDITIONAL).** Only if background GPS recording
  proves to be a real member need (see the trigger under Go / no-go). Wrap the
  hosted app, add a native background-geolocation plugin that records with the
  screen off and hands the track to the same recorded-track storage the web app
  already uses (#210/#211), plus native push. Reuses the whole web UI.
- **Deferred: React Native / fully native.** Revisit only if the club decides a
  flagship native app is worth maintaining a parallel UI for. Not now.

## MVP scope (Phase 0 PWA)

In:

- `manifest.webmanifest`: name, icons (maskable), `theme_color`, `background_color`,
  `display: standalone`, `start_url: /`.
- Service worker: precache the app shell; runtime-cache map tiles
  (stale-while-revalidate); an "download this area for offline" control that
  pre-fetches a bounding box of tiles into Cache Storage.
- Install affordance and an offline fallback page.

Out (Phase 0):

- Background GPS recording (still the in-browser recorder from #211, with its
  screen-on caveat surfaced in the UI). Closing this gap is the trigger for
  Phase 1.
- Native push on iOS without install (a platform limit, not a scope choice).

## Code reuse map

This is the core argument for PWA then Capacitor over React Native:

- **Portable to every path** (pure TypeScript, no framework or DOM):
  `src/lib/trails/{elevation,route-import,route-network,route-geometry,dem,schema}.ts`,
  `src/lib/hikes/{track,stats,sync,challenges}.ts` and the storage-abstracted
  `local-log.ts`, `src/lib/maps.ts`. These are the algorithms (distance,
  elevation, downsampling, graph routing, GPX, challenges) and they carry to a
  PWA, a Capacitor app, **or** a future RN app unchanged.
- **Reused as-is by PWA and Capacitor** (React DOM + Tailwind): all of
  `src/components` and `src/app`.
- **Not reusable by React Native:** the DOM/Tailwind UI; it would be rebuilt.

## Cost & overhead

- **PWA:** ~$0, no store, shipped and maintained as part of the web app.
- **Capacitor:** Apple Developer $99/yr + Google Play $25 once; app review; a
  native build/release pipeline (Xcode / Android Studio or a managed build); two
  store listings to maintain. The web app stays the single source of UI.
- **Expo / RN:** the same store fees plus a second front-end codebase to build
  and keep at parity. High ongoing cost.
- **Fully native:** the same fees plus two native codebases. Highest.

## Go / no-go

- **PWA: GO.** Low cost, high value, full reuse, no store gate. Proceed to
  Phase 0 implementation issues on approval of this spec.
- **Capacitor: CONDITIONAL GO.** Trigger: ship the PWA, then measure whether
  members attempt long recordings and lose them (or ask for screen-off
  recording). If the evidence is there, do Phase 1. If not, the PWA is enough.
- **React Native / fully native: NO (for now).** Reconsider only if a flagship
  native app becomes a club priority.

## Acceptance criteria

This is a research spike, so its artifact is this document and the decision in
it; there is no code and therefore no test plan.

- [x] All four approaches (PWA, Capacitor, Expo/RN, fully native) assessed
      against background GPS, offline tiles, push, code reuse, store/maintenance
      overhead, and cost (see the matrix and per-option notes).
- [x] A recommendation with a phased path is documented.
- [x] An MVP scope for the recommended first step (Phase 0 PWA) is defined.
- [x] A go / no-go decision is recorded.

## Non-goals

- Building any of the apps. Selecting and integrating a specific
  background-geolocation plugin or vendor. Setting up Apple / Google developer
  accounts. These belong to Phase 0/1 implementation issues opened only if this
  spec is approved.

## On approval

Accepting this spec means opening implementation issues for **Phase 0 (PWA)**:
manifest + service worker + offline tile cache, then Web Push (0b). Phase 1
(Capacitor) issues are opened only if its trigger condition is met. No
implementation issues are created by this spike itself, since its job is the
go / no-go decision.

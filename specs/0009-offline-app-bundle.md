# 0009: Offline app bundle (open with no signal)

- **Status:** phases 1-4 complete and the local bundle is the default load mode;
  on-device verification + the final offline-completeness pass pending (#324)
- **Issue:** #248 (depends on the Capacitor shell #215)
- **Supersedes** the "load the hosted site over the network" decision in spec
  0006 for the native app.

## Problem

The native app sets `server.url` to the hosted site, so it loads the app over
the network on every launch. While the app stays open the service worker serves
cached pages, but a **cold launch with no signal cannot fetch the start URL**,
and iOS WKWebView does not reliably let the service worker rescue the initial
launch — so the app opens to a black screen (#248). For a backcountry app this
defeats the point: it must open at a trailhead with no signal.

## Approach

Ship the app's pages **inside the native binary** and load them locally
(`capacitor://localhost`), so launching never needs the network. Dynamic data
(sync, contributions, auth, weather) is fetched from the production origin
(`https://www.tnhiking.club`) when online, and degrades to the local-first
stores when offline. The Vercel deployment is unchanged and remains the web app
and the API backend.

## Blockers (inventoried)

- **22 API route handlers** and the **OG / sitemap / robots route handlers**
  cannot exist in a static export. They are not needed in the bundle (they live
  on the server); the export build must exclude them.
- **6 pages** use request-time server features (`/hikes`, `/trails/[slug]`,
  `/leaderboard`, `/admin/submissions`, `/shop/[product]`,
  `/share/my-tennessee/[slugs]`). Their dynamic parts must render client-side so
  the page itself is static.
- **~20 client files** `fetch("/api/...")` relatively; from a locally-loaded
  origin those must target the production origin.
- **OAuth sign-in** redirects to github.com / google.com and back; from a
  `capacitor://localhost` origin the session cookie will not flow cross-origin,
  so sign-in needs reworking (Capacitor Browser + a deep link, or token auth).

## Phases (each shippable + device-verified)

1. **Static export pipeline.** A `CAPACITOR_BUILD` target that emits a static
   export to `out/` and syncs it as the Capacitor `webDir`. Exclude the API and
   OG/sitemap/robots route handlers from this build (a build step that sets
   `output: "export"` and skips those routes); the Vercel build is untouched.
   Make the 6 dynamic pages exportable by moving their request-time work to the
   client. Done when `pnpm build:capacitor` produces a static `out/`.
   _Done. `next.config.ts` flips to `output: "export"` (unoptimized images,
   `trailingSlash`) under `CAPACITOR_BUILD`, and `scripts/build-capacitor.mjs`
   relocates the server-only routes around the export and restores them. The
   dynamic pages were client-converted into the bundle (#308): `/trails` (filter
   on the device), `/hikes` (steward count + passkey gate client-side), and
   `/leaderboard` (board over `GET /api/leaderboard`). `/admin` and `/share`
   stay web-only by design (admins use the website; share links point to the
   production origin with the OG card, and the app only generates the URL to
   send). The API/OG/sitemap/robots route handlers are excluded as server-only._
2. **Absolute API origin.** An `apiUrl(path)` helper that resolves to the
   production origin on native and stays relative on web; route the ~20 client
   `fetch("/api/...")` calls through it. Offline, these fail and the local-first
   stores take over (already the case for the hike log).
3. **Load locally.** Drop `server.url` for the production app (keep it for
   `CAP_SERVER_URL` dev live-reload), point `webDir` at the export, and verify
   the app opens fully offline. Fold in the launch splash (#246).
   _Done: `capacitor.config.ts` loads the local bundle (`webDir: "out"`, no
   `server.url`) by **default**; `CAP_LOCAL_BUNDLE=0` is the escape hatch back to
   the hosted `server.url` mode, and `CAP_SERVER_URL` still overrides for dev
   live-reload. Build and sync with `pnpm cap:sync` (it runs `build:capacitor`
   first); `pnpm cap:sync:hosted` syncs the fallback mode._

   _Verified on the iOS simulator: the local-bundle app builds, launches, and
   renders the home page from the static export with no `server.url`, which is
   the core fix (it opens from the bundle, not the network). The device pass that
   the simulator cannot do (deep navigation across bundled pages, the maps
   rendering tiles from the native cache offline (#314), a true no-network
   launch, and the cross-origin sign-in round-trip) is tracked in #324. The
   default flipped to local now so that pass verifies exactly what ships._

4. **Auth from a local origin.** Sign-in via the Capacitor Browser opening the
   hosted OAuth flow and returning through a deep link, with the session carried
   back to the app. Until this lands, the app is usable signed-out (local-first
   logging still works; sync needs sign-in).
   _Done in code (bearer token, the approved approach over cross-origin cookies
   the WebView drops). Production `proxy.ts` answers CORS for the Capacitor
   origins and translates `Authorization: Bearer <session>` into the cookie
   `auth()` reads (#321); the client stores the token in the Keychain, attaches
   it to the cross-origin `/api` calls, loads it on launch, and clears it on
   sign-out (#323, #325). All gated to native + the local origin, so web is
   unchanged._
5. **Offline completeness.** Confirm trail content (static, in the bundle), the
   maps (tile precache, #244), and the local logs all work fully offline.

## Verification status

Phases 1-4 are implemented and the local bundle is now the **default** load mode
(`CAP_LOCAL_BUNDLE=0` falls back to the hosted `server.url` app). Verified in the
iOS simulator: the local bundle builds with all native plugins (including
`capacitor-secure-storage-plugin`), launches, and renders the home page from the
static export with no `server.url`. The interactive and offline checks the
simulator cannot do (host taps are TCC-blocked) are consolidated in **#324**:
offline cold launch, deep navigation, offline map tiles, the cross-origin
sign-in round-trip, and the same on Android. The default was flipped ahead of
that pass so it verifies exactly the configuration that ships; if the device pass
finds a blocker, `CAP_LOCAL_BUNDLE=0` is the one-flag fallback.

The update trade-off this locks in: trail content and UI ship frozen in the
bundle and change only with an app release, while user data stays live through
the production API (#258). Restoring over-the-air refresh (a live-update plugin
that swaps the bundle when online) is tracked separately in #335.

## Acceptance criteria (#248)

- [ ] Force-closing and relaunching fully offline opens the usable app.
- [ ] Online, browsing, data, sync, and sign-in still work.
- [ ] Verified on a real iOS and Android device.

## Risks / notes

- The export build excluding API/OG routes is the fiddly part; if a clean Next
  `output: "export"` exclusion is not possible, a build script that relocates
  those routes during the capacitor build is the fallback.
- Auth (phase 4) is the hardest; it is sequenced last so the rest of offline
  ships first and is independently verifiable.

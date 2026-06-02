# Mobile app (Capacitor)

The Tennessee Hiking Club mobile app is a [Capacitor](https://capacitorjs.com)
shell around the existing web app. See [`specs/0006-native-mobile-apps.md`](../specs/0006-native-mobile-apps.md)
for the decision and the full plan.

## Architecture

The native iOS/Android app loads the hosted site (`server.url` in
[`capacitor.config.ts`](../capacitor.config.ts)) and, in a follow-up, caches it
with a service worker so it keeps working offline after the first online open.
There is no separate static export: the app reuses the entire web UI and backend,
and relative API calls (`/api/...`) resolve against the hosted origin
automatically.

This is the foundation (#215). Background GPS recording (#216), offline map tiles
(#217), push (#218), and store release (#219) build on it.

## Prerequisites

- Node + pnpm (as for the web app).
- iOS: macOS with Xcode and CocoaPods.
- Android: Android Studio with the Android SDK.

## Setup

The native projects (`ios/`, `android/`) are generated locally and are currently
git-ignored, so generate them after cloning:

```bash
pnpm install
pnpm cap:add:ios       # macOS + Xcode
pnpm cap:add:android   # Android Studio
```

## Run

```bash
pnpm cap:sync          # copy web config + plugins into the native projects
pnpm cap:ios           # build and run on an iOS simulator/device
pnpm cap:android       # build and run on an Android emulator/device
# or open the native IDE:
pnpm cap:open:ios
pnpm cap:open:android
```

By default the app points at production (`https://www.tnhiking.club`). To point at
a preview deployment or a local backend, set `CAP_SERVER_URL` before
`pnpm cap:sync`:

```bash
CAP_SERVER_URL="https://<preview>.vercel.app" pnpm cap:sync
```

For a local `http://` backend during development, also set `cleartext: true` in
`capacitor.config.ts` (do not commit that).

## Status and next steps

Done (this is the foundation):

- Capacitor installed and configured to load the hosted app.
- npm scripts and this guide.
- **Offline service worker** (`public/sw.js`, registered by `PwaRegister`): pages,
  build assets, and map tiles are cached as they are first fetched, so the app
  works on the trail after the first online open. API requests are never cached.
  A precached `/offline` page is shown for routes you have not opened yet. The
  same service worker makes the website itself offline-capable.

- **Background GPS recording** (#216): on a native build, "Record this hike" uses
  the `@capacitor-community/background-geolocation` plugin so a hike keeps
  recording with the screen off; on the web it falls back to foreground
  `watchPosition`. The platform choice lives in `src/lib/hikes/geo-watcher.ts`,
  and both paths feed the same recorded-track storage.

  Native config this needs (already applied to the generated `ios/` project; add
  to `android/` when it is generated, and re-apply if the native projects are
  regenerated):

  - **iOS** `ios/App/App/Info.plist`: `NSLocationWhenInUseUsageDescription`,
    `NSLocationAlwaysAndWhenInUseUsageDescription`, and `UIBackgroundModes` with
    `location`.
  - **Android** `AndroidManifest.xml`: `ACCESS_FINE_LOCATION`,
    `ACCESS_BACKGROUND_LOCATION`, and `FOREGROUND_SERVICE` /
    `FOREGROUND_SERVICE_LOCATION`, plus the plugin's foreground service (see the
    plugin README).

  To test: rebuild the app (`pnpm cap:sync && pnpm cap:ios`), start a recording,
  grant location "Always", lock the screen and walk, then finish and confirm the
  track on My Hikes. Background GPS cannot be exercised on a simulator.

Next, within the mobile build:

- **Offline maps** (#217, the "download this area" UX on top of the tile cache),
  **push** (#218), and **store submission** (#219).

The native projects will be committed once we add the rest of the native
customizations (icons and splash screens); until then, re-apply the location
config above after a regeneration.

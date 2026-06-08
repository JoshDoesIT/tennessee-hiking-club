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
- iOS: macOS with Xcode. Capacitor 8 uses Swift Package Manager, so CocoaPods is
  not required.
- Android: Android Studio with the Android SDK.

## Setup

The native projects (`ios/`, `android/`) are committed, so their customizations
(the `tnhc://` sign-in deep link, background-location permissions, splash) are
version-controlled. After cloning, just install and sync:

```bash
pnpm install
pnpm cap:sync          # copy web config + plugins into the committed native projects
```

Build outputs and machine-specific files (`build/`, `.gradle/`, `local.properties`,
`Pods/`, `DerivedData/`, the synced `capacitor.config.json` and web assets) are
git-ignored. Only regenerate from scratch (`pnpm cap:add:*`) if a project is
deleted; re-apply the native customizations afterward (see the list below).

## App icon and splash

The native app icon and launch splash are generated from the TNHC badge
(`assets/logo.png`, the 1024x1024 source) with `@capacitor/assets` (#299). To
regenerate after a logo change, replace `assets/logo.png` and run:

```bash
npx capacitor-assets generate \
  --iconBackgroundColor '#fbf6e9' --iconBackgroundColorDark '#161a12' \
  --splashBackgroundColor '#2a3623' --splashBackgroundColorDark '#161a12'
```

It writes the icon + splash resources into `ios/` and `android/` (commit those).
It also emits stray PWA icons at the repo root and a `public/manifest.webmanifest`;
delete those (the web PWA icons are handled separately). Note: the bundled
`sharp` needs the `sharp` pnpm override (Node 22 has no `sharp@0.32` prebuilt).

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

## Testing on a real device

Because the app loads the deployed site (`server.url`), a device runs whatever is
live in production. Offline maps and background GPS are deployed, so they can be
exercised on a phone; push (#218) cannot until its native plugin and APNs/FCM
credentials are configured.

The setup is non-interactive and can be staged ahead of time. Everything from
"open the IDE" onward needs the device connected and on-device taps (trust,
permissions), so do it at test time.

### iPhone

Needs a Mac with Xcode and an Apple ID (a free one works for your own device).

1. `pnpm install && pnpm cap:sync` (the `ios/` project already exists).
2. `pnpm cap:open:ios` to open Xcode.
3. Plug in the iPhone, unlock it, and tap **Trust This Computer**.
4. Xcode -> the **App** target -> **Signing & Capabilities** -> tick
   **Automatically manage signing** and pick your **Team** (add your Apple ID
   under Xcode -> Settings -> Accounts first if needed).
5. Choose the iPhone in the device dropdown and click **Run** (the play button).
6. First launch: on the phone, **Settings -> General -> VPN & Device Management
   -> [your developer profile] -> Trust**, then reopen the app.
7. Allow Location **Always** when prompted.

A free Apple ID re-signs every 7 days (just re-run from Xcode); a paid Apple
Developer account is required for TestFlight and the App Store (#219).

### Android

Needs Android Studio with the SDK.

1. Generate the project if it does not exist yet:
   `pnpm cap:add:android && pnpm cap:sync`.
2. On the phone, enable **Developer options** (Settings -> About phone -> tap
   **Build number** seven times) and turn on **USB debugging**.
3. Connect via USB and accept the debugging prompt; confirm with `adb devices`.
4. `pnpm cap:open:android`, pick the device, and **Run** (or
   `pnpm exec cap run android --target <device-id>`).
5. Allow Location when prompted.

Debug installs need no signing; a signed release build is only for the Play
Store (#219).

### What to verify on device

- **Offline maps (#217):** on `/explore`, choose "Download this area" while
  online, then switch to Airplane mode and confirm the map still renders and
  pans there, and trail pages load.
- **Background GPS (#216):** record a hike with location set to **Always**, lock
  the screen and move (or use a simulated route), then confirm the track on My
  Hikes. This cannot be exercised on a simulator.

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

- **Native sign-in** (#280): OAuth runs in the system browser and returns to the
  app via a `tnhc://auth?code=...` deep link (`src/lib/auth/native-signin.ts`).
  Each platform must register the `tnhc` URL scheme, or the redirect never
  returns and sign-in fails. This was the Android gap found in device testing:
  the scheme was on iOS but never added to a freshly generated `android/`.

  Native config this needs (re-apply if the native projects are regenerated):
  - **iOS** `ios/App/App/Info.plist`: a `CFBundleURLTypes` entry whose
    `CFBundleURLSchemes` includes `tnhc` (already applied).
  - **Android** `android/app/src/main/AndroidManifest.xml`: on `.MainActivity`
    (already `launchMode="singleTask"`), an `<intent-filter>` with the `VIEW`
    action, `DEFAULT` + `BROWSABLE` categories, and `<data android:scheme="tnhc" />`.

  To test: rebuild (`pnpm cap:sync` then run), tap **Sign in -> GitHub/Google**,
  and confirm the browser returns to the app signed in. Quick check that the
  deep link is wired, no OAuth round-trip needed:
  `adb shell am start -a android.intent.action.VIEW -d "tnhc://auth?code=test"`
  should foreground the app.

- **Offline maps** (#217): a "download this area" control and an offline-maps
  manager on `/explore`, on top of the service-worker tile cache. Downloaded
  regions are tracked locally and evicted precisely when removed.

- **Push notifications** (#218, scaffolded): the `push_subscriptions` store, the
  registration API, the opt-in toggle, and the send path. The native
  `@capacitor/push-notifications` plugin, APNs/FCM credentials, and the delivery
  transport are still to do (tracked on #218).

Next, within the mobile build:

- Finish **push** (#218) transport + credentials, then **store submission**
  (#219).

The native projects are committed, so the native customizations above (the
sign-in deep link, location permissions, splash) are version-controlled and no
longer need re-applying per machine. Only re-apply them if a native project is
deleted and regenerated from scratch.

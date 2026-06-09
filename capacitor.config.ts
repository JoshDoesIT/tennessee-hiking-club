import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Tennessee Hiking Club mobile app (#215).
 *
 * Two load modes (spec 0009):
 * - **Default (local bundle):** load the static export (`out/`) from inside the
 *   app, so it opens with no signal. No `server.url`, so launching never needs
 *   the network; the app calls the production API over absolute URLs when online
 *   (#258). This is what ships. Trail content and UI are frozen at build time;
 *   user data stays live through the API.
 * - **Hosted fallback (`CAP_LOCAL_BUNDLE=0`):** load the hosted web app over
 *   `server.url`; the service worker caches it so it works offline after the
 *   first open. `webDir` is then just the branded offline fallback page. Kept as
 *   a one-flag escape hatch back to the old network-loaded behaviour.
 *
 * `CAP_SERVER_URL` overrides the origin for a preview deployment or a local
 * backend during development (set `cleartext: true` for plain http); it wins in
 * either mode for live-reload.
 */
const localBundle = process.env.CAP_LOCAL_BUNDLE !== "0";
const serverOverride = process.env.CAP_SERVER_URL || undefined;
const serverUrl =
  serverOverride ?? (localBundle ? undefined : "https://www.tnhiking.club");

const config: CapacitorConfig = {
  appId: "club.tnhiking.app",
  appName: "Tennessee Hiking Club",
  // Local-bundle mode serves the static export; otherwise the minimal offline
  // fallback page (the hosted app is the real UI over server.url).
  webDir: localBundle ? "out" : "mobile",
  // No server block in local-bundle mode (and no override): the app loads
  // `webDir` locally with no remote origin.
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: false,
          // Shown when the launch navigation to `url` fails (e.g. a cold launch
          // with no signal). Without it WKWebView shows a black screen; this
          // serves the branded offline page from `webDir` instead (#248, opt 1).
          errorPath: "index.html",
        },
      }
    : {}),
  plugins: {
    // A branded forest launch splash so the app does not flash a black/white
    // screen while the web app loads (#246). It stays up (no auto-hide)
    // until the web app is ready and calls `SplashScreen.hide()` (see
    // SplashHider). No spinner: on Android 12+ the launch splash is the OS
    // system splash (an icon on a colour), which has no place for the plugin
    // spinner, so a configured spinner showed on iOS but never on Android. A
    // clean, spinner-free branded splash is consistent across both (#295).
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#2a3623",
      showSpinner: false,
    },
  },
};

export default config;

import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Tennessee Hiking Club mobile app (#215, spec
 * 0006). The app is a native iOS/Android shell that loads the hosted web app and
 * (in a follow-up) caches it with a service worker, so it works offline after
 * the first online open. This reuses the entire web UI and backend; there is no
 * separate static export.
 *
 * `CAP_SERVER_URL` overrides the origin for a preview deployment or a local
 * backend during development (set `cleartext: true` below for plain http).
 */
const config: CapacitorConfig = {
  appId: "club.tnhiking.app",
  appName: "Tennessee Hiking Club",
  // Minimal offline fallback bundle; the hosted app is the real UI (server.url).
  webDir: "mobile",
  server: {
    url: process.env.CAP_SERVER_URL ?? "https://www.tnhiking.club",
    cleartext: false,
  },
};

export default config;

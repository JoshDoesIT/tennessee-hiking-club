import { Capacitor } from "@capacitor/core";

/** The production origin that hosts the API (and the website). */
export const API_ORIGIN = "https://www.tnhiking.club";

type PatchedFetch = typeof fetch & { __apiOriginPatched?: boolean };

/**
 * Groundwork for the offline app bundle (#248, spec 0009). Once the native app
 * is bundled and loaded from a local origin (`capacitor://localhost`), a
 * relative `fetch("/api/...")` would resolve against that local origin, where
 * there is no server. This rewrites those relative API calls to the production
 * origin so the bundled app reaches the real backend when online.
 *
 * No-op on the web and in the current native build (which loads the production
 * origin directly, so relative paths already work). Idempotent. Auth across the
 * local origin is a later phase (#248 phase 4).
 */
export function installApiOriginRewrite(
  win: (Window & typeof globalThis) | undefined =
    typeof window !== "undefined" ? window : undefined,
): void {
  if (!win || !Capacitor.isNativePlatform()) return;
  if (win.location.origin === API_ORIGIN) return;

  const current = win.fetch as PatchedFetch;
  if (current.__apiOriginPatched) return;

  const original = win.fetch.bind(win);
  const patched: PatchedFetch = ((input, init) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      return original(`${API_ORIGIN}${input}`, init);
    }
    return original(input, init);
  }) as PatchedFetch;
  patched.__apiOriginPatched = true;
  win.fetch = patched;
}

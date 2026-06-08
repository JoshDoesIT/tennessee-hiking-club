import type { NextConfig } from "next";

/**
 * Two build targets from one app (spec 0009):
 *
 * - The default (Vercel) build is the full server app: API routes, OG images,
 *   dynamic pages, and `/sw.js` revalidation headers.
 * - The Capacitor build (`CAPACITOR_BUILD=1`, via `scripts/build-capacitor.mjs`)
 *   emits a static export bundled into the native app so it opens with no
 *   signal (#248). It runs from a local origin with no server, so the server-only
 *   routes are excluded by the build script and Next image optimization is off
 *   (there is no `/_next/image` handler in a static bundle). `trailingSlash`
 *   makes routes resolve to `dir/index.html` when served from the local bundle.
 *   `headers()` is unsupported with `output: "export"`, so it is web-only.
 */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = isCapacitorBuild
  ? {
      output: "export",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      async headers() {
        return [
          {
            // The service worker must always be revalidated so a new deploy is
            // picked up promptly (paired with `updateViaCache: "none"` in
            // PwaRegister); it may control the whole origin.
            source: "/sw.js",
            headers: [
              {
                key: "Cache-Control",
                value: "no-cache, no-store, must-revalidate",
              },
              { key: "Service-Worker-Allowed", value: "/" },
            ],
          },
        ];
      },
    };

export default nextConfig;

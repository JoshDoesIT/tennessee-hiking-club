"use client";

import { installApiOriginRewrite } from "@/lib/api-origin";
import { initNativeAuth } from "@/lib/auth/native-session-init";

/**
 * Installs the API-origin rewrite (#248) as early as possible so it is in place
 * before any component fetches `/api/...`, and (once) loads the persisted
 * session token so cross-origin API calls can attach it as a bearer (phase 4).
 * Idempotent and client-only; a no-op except in a locally-bundled native app.
 * Renders nothing.
 */
let nativeAuthStarted = false;

export function ApiOriginSetup() {
  if (typeof window !== "undefined") {
    installApiOriginRewrite(window);
    if (!nativeAuthStarted) {
      nativeAuthStarted = true;
      void initNativeAuth();
    }
  }
  return null;
}

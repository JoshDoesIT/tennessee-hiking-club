"use client";

import { installApiOriginRewrite } from "@/lib/api-origin";

/**
 * Installs the API-origin rewrite (#248) as early as possible so it is in place
 * before any component fetches `/api/...`. Idempotent and client-only; a no-op
 * except in a locally-bundled native app. Renders nothing.
 */
export function ApiOriginSetup() {
  if (typeof window !== "undefined") installApiOriginRewrite(window);
  return null;
}

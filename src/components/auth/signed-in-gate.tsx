"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders its children only for a signed-in member, resolved client-side via
 * `/api/auth/session` so the surrounding page can be a static export (#308).
 * Renders nothing while the session is unknown, signed out, or offline. This is
 * presentational gating only; the API still enforces auth on every request.
 */
export function SignedInGate({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((session) => {
        if (active && session?.user) setSignedIn(true);
      })
      .catch(() => {
        /* offline or no backend: stay gated */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!signedIn) return null;
  return <>{children}</>;
}

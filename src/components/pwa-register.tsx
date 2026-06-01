"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (#215) so the app keeps working offline after the
 * first online open. Production only: in development the service worker is
 * skipped to avoid stale caches while iterating. Renders nothing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a progressive enhancement; ignore failures.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (#215) and keeps it current so a deploy shows up
 * without quitting the app:
 *
 * - registers with `updateViaCache: "none"` and re-checks for a new worker every
 *   time the app regains focus, so an update is noticed promptly;
 * - reloads once when a *new* worker takes control (a deploy), guarded so the
 *   first install (which also fires `controllerchange`) and repeat events can't
 *   cause a reload loop.
 *
 * Still offline-capable, and production only (skipped in dev to avoid stale
 * caches while iterating). Renders nothing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const sw =
      typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;
    if (!sw) return;

    // A controllerchange when a worker already controlled the page means a new
    // deploy took over; the first-ever install has no prior controller and must
    // not reload.
    const hadController = Boolean(sw.controller);
    let refreshing = false;
    const onControllerChange = () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    sw.addEventListener("controllerchange", onControllerChange);

    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => {
      if (document.visibilityState === "visible") void registration?.update();
    };

    const register = async () => {
      try {
        registration = await sw.register("/sw.js", { updateViaCache: "none" });
      } catch {
        // Offline support is a progressive enhancement; ignore failures.
      }
    };
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });

    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, []);

  return null;
}

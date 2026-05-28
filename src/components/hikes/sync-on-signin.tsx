"use client";

import { useEffect, useRef } from "react";
import { readLog, replaceLog } from "@/lib/hikes/local-log";
import { getCleanups, replaceCleanups } from "@/lib/stewardship/cleanups";

/**
 * When signed in, reconcile local state with the account once on mount: push
 * the on-device hikes and cleanups to the server, then adopt the merged result
 * so the account's data appears locally too. Hikes and cleanups sync
 * independently, so one side failing does not block the other. Invisible;
 * no-op when signed out.
 */
export function SyncOnSignIn() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let active = true;
    (async () => {
      try {
        const session = await (await fetch("/api/auth/session")).json();
        if (!session?.user) return;

        const hikeRes = await fetch("/api/hikes/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hikes: readLog() }),
        });
        if (hikeRes.ok) {
          const data = await hikeRes.json();
          if (active && Array.isArray(data.hikes)) replaceLog(data.hikes);
        }

        const cleanupRes = await fetch("/api/cleanups/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cleanups: getCleanups() }),
        });
        if (cleanupRes.ok) {
          const data = await cleanupRes.json();
          if (active && Array.isArray(data.cleanups)) {
            replaceCleanups(data.cleanups);
          }
        }
      } catch {
        // Sync is best effort; local state remains the source of truth.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return null;
}

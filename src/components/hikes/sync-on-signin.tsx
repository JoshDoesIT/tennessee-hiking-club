"use client";

import { useEffect, useRef } from "react";
import { readLog, replaceLog } from "@/lib/hikes/local-log";

/**
 * When signed in, reconcile the local hike log with the account once on mount:
 * push the on-device hikes to the server, then adopt the merged result so the
 * account's hikes appear locally too. Invisible; no-op when signed out.
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

        const res = await fetch("/api/hikes/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hikes: readLog() }),
        });
        if (!res.ok) return;

        const data = await res.json();
        if (active && Array.isArray(data.hikes)) replaceLog(data.hikes);
      } catch {
        // Sync is best effort; the local log remains the source of truth.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { readLog, replaceLog, setEntryPhotoUrl } from "@/lib/hikes/local-log";
import { mergeHikes } from "@/lib/hikes/sync";
import { getPhoto } from "@/lib/hikes/photo-store";
import { uploadPhoto } from "@/lib/hikes/photo-upload";
import { getCleanups, replaceCleanups } from "@/lib/stewardship/cleanups";

async function postHikeSync() {
  return fetch("/api/hikes/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hikes: readLog() }),
  });
}

/**
 * Upload any photos that exist only on this device (a local `photoId` but no
 * synced `photoUrl`) and record their URLs, then re-sync so the account picks
 * them up. Best-effort: a failed upload leaves the local copy in place.
 */
async function backfillPhotos(): Promise<void> {
  const pending = readLog().filter((e) => e.photoId && !e.photoUrl);
  let uploadedAny = false;
  for (const entry of pending) {
    const blob = await getPhoto(entry.photoId!);
    if (!blob) continue;
    const url = await uploadPhoto(blob);
    if (url) {
      setEntryPhotoUrl(entry.trailSlug, entry.hikedOn, url);
      uploadedAny = true;
    }
  }
  if (uploadedAny) await postHikeSync();
}

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

        const before = readLog();
        const hikeRes = await postHikeSync();
        if (hikeRes.ok) {
          const data = await hikeRes.json();
          if (active && Array.isArray(data.hikes)) {
            // Re-merge with the pre-sync log so device-local photoIds (which the
            // server doesn't store) survive the round-trip.
            replaceLog(mergeHikes(before, data.hikes));
            await backfillPhotos();
          }
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

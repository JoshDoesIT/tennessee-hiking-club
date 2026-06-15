"use client";

import { useEffect, useRef } from "react";
import { readLog, replaceLog, setEntryPhotoUrls } from "@/lib/hikes/local-log";
import { entryPhotoIds } from "@/lib/hikes/entry-photos";
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
 * Upload every photo that exists only on this device (local blob ids without a
 * synced URL yet) and record the URLs aligned by index, then re-sync so the
 * account picks them up (#361). Best-effort: a failed upload leaves the local
 * copy in place to retry next time. Handles both legacy single-photo hikes and
 * multi-photo hikes, and resumes a partially-uploaded set.
 */
async function backfillPhotos(): Promise<void> {
  let uploadedAny = false;
  for (const entry of readLog()) {
    const ids = entryPhotoIds(entry);
    if (ids.length === 0) continue;
    const existing =
      entry.photoUrls ?? (entry.photoUrl ? [entry.photoUrl] : []);
    if (existing.length >= ids.length && existing.every(Boolean)) continue;

    const urls: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      if (existing[i]) {
        urls.push(existing[i]);
        continue;
      }
      const blob = await getPhoto(ids[i]);
      const url = blob ? await uploadPhoto(blob) : null;
      urls.push(url ?? "");
      if (url) uploadedAny = true;
    }
    if (urls.some(Boolean)) {
      setEntryPhotoUrls(entry.trailSlug, entry.hikedOn, urls);
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

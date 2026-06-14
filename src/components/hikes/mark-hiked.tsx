"use client";

import { useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
  addHike,
  setEntryPhotoUrl,
} from "@/lib/hikes/local-log";
import { compressImage } from "@/lib/hikes/image";
import { putPhoto } from "@/lib/hikes/photo-store";
import { uploadPhoto } from "@/lib/hikes/photo-upload";
import { gpxTrackSummary } from "@/lib/hikes/track";
import { HIKE_CONDITIONS, type RecordedTrack } from "@/lib/hikes/types";
import { PhotoPreviews } from "@/components/ui/photo-previews";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Log a hike of a trail (#201, #229): tap "Mark as hiked" to record it on the
 * chosen date (today by default), optionally with conditions, a note, a photo,
 * or a recorded GPX track. A trail can be logged more than once (on different
 * dates); each logged hike is managed and deleted on My Hikes. Local-first via
 * `useSyncExternalStore`; no account required.
 */
export function MarkHiked({ slug }: { slug: string }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );
  const count = log.filter((e) => e.trailSlug === slug).length;

  const [showDetails, setShowDetails] = useState(false);
  const [date, setDate] = useState<string>(today);
  const [note, setNote] = useState("");
  const [conditions, setConditions] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const detailsId = useId();

  async function logHike() {
    const when = date || today();
    if (log.some((e) => e.trailSlug === slug && e.hikedOn === when)) {
      setStatus("Already logged for that date.");
      return;
    }

    let photoId: string | undefined;
    let blob: Blob | undefined;
    if (photo) {
      blob = await compressImage(photo);
      photoId = crypto.randomUUID();
      await putPhoto(photoId, blob);
    }

    // Parse an optional recorded GPX track on the device; a malformed file is
    // ignored so the hike still logs.
    let track: RecordedTrack | undefined;
    if (trackFile) {
      try {
        const summary = gpxTrackSummary(await trackFile.text());
        if (summary) {
          track = {
            points: summary.points,
            ...(summary.durationMin !== undefined
              ? { durationMin: summary.durationMin }
              : {}),
          };
        }
      } catch {
        track = undefined;
      }
    }

    addHike(slug, when, { note, conditions, photoId, track });
    setStatus("Logged.");
    setNote("");
    setConditions("");
    setPhoto(null);
    setTrackFile(null);
    setDate(today());
    setShowDetails(false);

    // Best-effort: when signed in, upload to the account and record the URL so
    // the photo syncs across devices. Stays local-only if signed out/offline.
    if (blob) {
      const url = await uploadPhoto(blob);
      if (url) setEntryPhotoUrl(slug, when, url);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={logHike}>
          {count > 0 ? "Log another hike" : "Mark as hiked"}
        </Button>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          aria-controls={showDetails ? detailsId : undefined}
          className="text-olive hover:text-forest text-sm font-medium underline-offset-4 hover:underline"
        >
          {showDetails ? "Hide details" : "Add a date, note, conditions, or photo"}
        </button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>

      {count > 0 ? (
        <p className="text-ink/60 mt-1 text-sm">
          Hiked {count} time{count === 1 ? "" : "s"}.{" "}
          <Link
            href="/hikes"
            className="text-pine hover:text-forest underline underline-offset-4"
          >
            Manage on My hikes
          </Link>
          .
        </p>
      ) : null}

      {showDetails ? (
        <div
          id={detailsId}
          className="border-forest/10 bg-cream-50 mt-3 grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${detailsId}-date`}
              className="text-olive text-xs font-semibold tracking-wider uppercase"
            >
              Date hiked
            </label>
            <input
              id={`${detailsId}-date`}
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="border-forest/20 text-ink rounded-lg border bg-cream-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${detailsId}-cond`}
              className="text-olive text-xs font-semibold tracking-wider uppercase"
            >
              Conditions
            </label>
            <select
              id={`${detailsId}-cond`}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className="border-forest/20 text-ink rounded-lg border bg-cream-50 px-3 py-2 text-sm"
            >
              <option value="">Not noted</option>
              {HIKE_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor={`${detailsId}-note`}
              className="text-olive text-xs font-semibold tracking-wider uppercase"
            >
              Note
            </label>
            <input
              id={`${detailsId}-note`}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. busy lot, bring bug spray"
              className="border-forest/20 text-ink rounded-lg border bg-cream-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor={`${detailsId}-photo`}
              className="text-olive text-xs font-semibold tracking-wider uppercase"
            >
              Photo
            </label>
            <input
              id={`${detailsId}-photo`}
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="text-ink file:border-forest/20 file:text-pine hover:file:bg-cream-50 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:bg-cream-50 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <PhotoPreviews files={photo ? [photo] : []} />
            <p className="text-ink/50 text-xs">
              Stays on this device until you sign in.
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor={`${detailsId}-track`}
              className="text-olive text-xs font-semibold tracking-wider uppercase"
            >
              Recorded track (GPX)
            </label>
            <input
              id={`${detailsId}-track`}
              type="file"
              accept=".gpx,application/gpx+xml,application/xml,text/xml"
              onChange={(e) => setTrackFile(e.target.files?.[0] ?? null)}
              className="text-ink file:border-forest/20 file:text-pine hover:file:bg-cream-50 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:bg-cream-50 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-ink/50 text-xs">
              Exported from a watch or app, to map this hike and chart its
              elevation.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
  addHike,
  removeTrail,
} from "@/lib/hikes/local-log";
import { compressImage } from "@/lib/hikes/image";
import { putPhoto } from "@/lib/hikes/photo-store";
import { HIKE_CONDITIONS } from "@/lib/hikes/types";

/** Local-first "mark as hiked" toggle for a trail, with an optional note and
 *  conditions captured at log time. Reads the browser-stored log via
 *  useSyncExternalStore (SSR-safe) and persists with no account required. */
export function MarkHiked({ slug }: { slug: string }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );
  const hiked = log.some((e) => e.trailSlug === slug);

  const [showDetails, setShowDetails] = useState(false);
  const [note, setNote] = useState("");
  const [conditions, setConditions] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const detailsId = useId();

  if (hiked) {
    return (
      <Button variant="primary" aria-pressed onClick={() => removeTrail(slug)}>
        Hiked
      </Button>
    );
  }

  async function logHike() {
    let photoId: string | undefined;
    if (photo) {
      const blob = await compressImage(photo);
      photoId = crypto.randomUUID();
      await putPhoto(photoId, blob);
    }
    addHike(slug, new Date().toISOString().slice(0, 10), {
      note,
      conditions,
      photoId,
    });
    setNote("");
    setConditions("");
    setPhoto(null);
    setShowDetails(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" aria-pressed={false} onClick={logHike}>
          Mark as hiked
        </Button>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          aria-controls={showDetails ? detailsId : undefined}
          className="text-olive hover:text-forest text-sm font-medium underline-offset-4 hover:underline"
        >
          {showDetails ? "Hide details" : "Add a note, conditions, or photo"}
        </button>
      </div>

      {showDetails ? (
        <div
          id={detailsId}
          className="border-forest/10 bg-cream-50 mt-3 grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
        >
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
              className="border-forest/20 text-ink rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="">Not noted</option>
              {HIKE_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
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
              className="border-forest/20 text-ink rounded-lg border bg-white px-3 py-2 text-sm"
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
              className="text-ink file:border-forest/20 file:text-pine hover:file:bg-cream-50 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-ink/50 text-xs">
              Stays on this device until you sign in.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

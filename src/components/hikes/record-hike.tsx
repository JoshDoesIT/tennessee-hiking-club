"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildElevationProfile } from "@/lib/trails/elevation";
import { RecordingMap } from "@/components/map/recording-map";
import {
  useRecording,
  startRecording,
  pauseRecording,
  resumeRecording,
  discardRecording,
  finishRecording,
} from "@/lib/hikes/recording-store";

type Confirm = "discard" | "finish" | null;

/**
 * Record a hike live (#201, #216, #267). The recording itself lives in an
 * app-wide store (`recording-store`), so it keeps running as the member moves
 * between screens and survives a relaunch; this component is just the controls
 * for the trail it is on. Stopping the recording (finish or discard) always
 * takes an explicit confirmation so a stray tap cannot end or lose it.
 */
export function RecordHike({
  slug,
  trailName,
  coordinates,
  route,
}: {
  slug: string;
  trailName: string;
  coordinates: { lat: number; lng: number };
  route?: { lat: number; lng: number }[];
}) {
  const rec = useRecording();
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<Confirm>(null);

  const activeHere = rec.status !== "idle" && rec.slug === slug;
  const activeElsewhere = rec.status !== "idle" && rec.slug !== slug;

  function start() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessage("Location isn’t available on this device.");
      return;
    }
    setMessage("");
    startRecording(slug, trailName);
  }

  function onFinish() {
    setConfirm(null);
    setMessage(
      finishRecording()
        ? "Saved to My Hikes."
        : "Not enough movement was recorded to save a track.",
    );
  }

  function onDiscard() {
    setConfirm(null);
    discardRecording();
    setMessage("");
  }

  const profile =
    rec.points.length >= 2 ? buildElevationProfile(rec.points) : null;
  const miles = profile ? profile.totalMiles.toFixed(2) : "0.00";
  const currentElevation = rec.points.length
    ? rec.points[rec.points.length - 1].elevationFt
    : 0;

  return (
    <div
      className="border-forest/10 bg-cream-50 mt-3 rounded-xl border p-4"
      aria-label={`Record a live hike of ${trailName}`}
    >
      <p className="text-forest text-sm font-medium">Record this hike live</p>

      {activeElsewhere ? (
        <p className="text-ink/75 mt-2 text-sm">
          A hike is already recording on{" "}
          <span className="font-medium">{rec.trailName}</span>. Finish or
          discard it before starting a new one.
        </p>
      ) : activeHere ? (
        <>
          <p
            className="text-ink/75 mt-2 text-sm"
            role="status"
            aria-live="polite"
          >
            {miles} mi · {rec.points.length} pts ·{" "}
            {currentElevation.toLocaleString()} ft
            {rec.status === "paused" ? " · paused" : ""}
          </p>

          <RecordingMap
            center={coordinates}
            route={route}
            points={rec.points}
            trailName={trailName}
          />

          {confirm ? (
            <div className="mt-3">
              <p className="text-ink/80 text-sm">
                {confirm === "discard"
                  ? "Discard this recording? Your tracked route will be lost, and this can’t be undone."
                  : "Finish and save this hike to My Hikes?"}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm(null)}
                >
                  Keep recording
                </Button>
                <Button
                  type="button"
                  variant={confirm === "discard" ? "ghost" : "accent"}
                  size="sm"
                  onClick={confirm === "discard" ? onDiscard : onFinish}
                >
                  {confirm === "discard"
                    ? "Discard recording"
                    : "Finish & save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {rec.status === "recording" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => pauseRecording()}
                >
                  Pause
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resumeRecording()}
                >
                  Resume
                </Button>
              )}
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={() => setConfirm("finish")}
              >
                Finish
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirm("discard")}
              >
                Discard
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-ink/75 mt-1 text-xs">
            Recording keeps going as you move between screens, even with the
            screen off. Finish or Discard stops it.
          </p>
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={start}>
              {message.includes("Saved")
                ? "Record another"
                : "Record this hike"}
            </Button>
          </div>
        </>
      )}

      {message ? (
        <p className="text-pine mt-2 text-sm" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}

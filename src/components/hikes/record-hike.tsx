"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { addHike } from "@/lib/hikes/local-log";
import { downsampleRoute } from "@/lib/trails/route-import";
import { buildElevationProfile, type RoutePoint } from "@/lib/trails/elevation";
import { startLocationWatch, type StopWatch } from "@/lib/hikes/geo-watcher";

type Status = "idle" | "recording" | "paused" | "saved";

/** Cap a recorded track so the stored log stays small; on-the-ground recordings
 *  can run to thousands of points. */
const MAX_POINTS = 200;

/**
 * Record a hike live (#201, #216): start, pause/resume, and finish a location
 * session, showing live distance and elevation. On a native build this records
 * in the background with the screen off (the background-geolocation plugin behind
 * `startLocationWatch`); in the browser it uses foreground `watchPosition`. On
 * finish the track is downsampled and logged against this trail (local-first,
 * synced when signed in), so it appears on My Hikes like an uploaded GPX.
 */
export function RecordHike({
  slug,
  trailName,
}: {
  slug: string;
  trailName: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [message, setMessage] = useState("");
  const stopWatch = useRef<StopWatch | null>(null);
  const watching = useRef(false);
  const elapsedMs = useRef(0);
  const segmentStart = useRef<number | null>(null);

  function beginWatch() {
    segmentStart.current = Date.now();
    watching.current = true;
    void startLocationWatch(
      (point) => setPoints((prev) => [...prev, point]),
      (msg) => setMessage(msg),
    ).then((stop) => {
      // If recording was stopped before the watcher finished starting, stop it.
      if (watching.current) stopWatch.current = stop;
      else stop();
    });
  }

  function endWatch() {
    watching.current = false;
    if (stopWatch.current) {
      stopWatch.current();
      stopWatch.current = null;
    }
    if (segmentStart.current != null) {
      elapsedMs.current += Date.now() - segmentStart.current;
      segmentStart.current = null;
    }
  }

  function start() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessage("Location isn’t available on this device.");
      return;
    }
    setPoints([]);
    setMessage("");
    elapsedMs.current = 0;
    setStatus("recording");
    beginWatch();
  }

  function pause() {
    endWatch();
    setStatus("paused");
  }

  function resume() {
    setStatus("recording");
    beginWatch();
  }

  function discard() {
    endWatch();
    setPoints([]);
    elapsedMs.current = 0;
    setStatus("idle");
    setMessage("");
  }

  function finish() {
    endWatch();
    if (points.length < 2) {
      setStatus("idle");
      setMessage("Not enough movement was recorded to save a track.");
      return;
    }
    const route = downsampleRoute(points, MAX_POINTS);
    const durationMin = Math.round(elapsedMs.current / 60_000);
    const date = new Date().toISOString().slice(0, 10);
    addHike(slug, date, {
      track: {
        points: route,
        ...(durationMin > 0 ? { durationMin } : {}),
      },
    });
    setPoints([]);
    setStatus("saved");
    setMessage("Saved to My Hikes.");
  }

  const live = status === "recording" || status === "paused";
  const profile = points.length >= 2 ? buildElevationProfile(points) : null;
  const miles = profile ? profile.totalMiles.toFixed(2) : "0.00";
  const currentElevation = points.length
    ? points[points.length - 1].elevationFt
    : 0;

  return (
    <div
      className="border-forest/10 bg-cream-50 mt-3 rounded-xl border p-4"
      aria-label={`Record a live hike of ${trailName}`}
    >
      <p className="text-forest text-sm font-medium">Record this hike live</p>

      {live ? (
        <>
          <p
            className="text-ink/75 mt-2 text-sm"
            role="status"
            aria-live="polite"
          >
            {miles} mi · {points.length} pts ·{" "}
            {currentElevation.toLocaleString()} ft
            {status === "paused" ? " · paused" : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {status === "recording" ? (
              <Button type="button" variant="outline" size="sm" onClick={pause}>
                Pause
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resume}
              >
                Resume
              </Button>
            )}
            <Button type="button" variant="accent" size="sm" onClick={finish}>
              Finish
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={discard}>
              Discard
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-ink/75 mt-1 text-xs">
            Uses your device location while this stays open. Keep the screen on;
            phone-browser GPS can pause when the screen sleeps.
          </p>
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={start}>
              {status === "saved" ? "Record another" : "Record this hike"}
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

"use client";

import Link from "next/link";
import { useRecording } from "@/lib/hikes/recording-store";
import { buildElevationProfile } from "@/lib/trails/elevation";

/**
 * A small fixed pill shown from any screen while a hike is recording (#267), so
 * the member always knows it is still running and can tap back to its controls.
 * Renders nothing when idle. Mounted app-wide in the layout.
 */
export function RecordingIndicator() {
  const rec = useRecording();
  if (rec.status === "idle" || !rec.slug) return null;

  const paused = rec.status === "paused";
  const miles =
    rec.points.length >= 2
      ? buildElevationProfile(rec.points).totalMiles.toFixed(1)
      : "0.0";

  return (
    <Link
      href={`/trails/${rec.slug}`}
      aria-label={`${paused ? "Paused" : "Recording"} hike on ${rec.trailName}. Open its controls.`}
      className="recording-pill border-forest/15 bg-cream/95 text-ink fixed bottom-4 left-1/2 z-40 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur"
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          paused ? "bg-amber" : "animate-pulse bg-red-600"
        }`}
      />
      <span className="truncate">
        {paused ? "Paused" : "Recording"} · {rec.trailName} · {miles} mi
      </span>
    </Link>
  );
}

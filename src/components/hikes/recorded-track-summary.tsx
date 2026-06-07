"use client";

import { buildElevationProfile } from "@/lib/trails/elevation";
import { routeShapePath } from "@/lib/hikes/route-shape";
import { DownloadGpx } from "@/components/trails/download-gpx";
import type { RecordedTrack } from "@/lib/hikes/types";

/** Whole-minute duration as a compact "1h 30m" / "45m" label. */
function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Compact view of a recorded hike track (#201) for the My Hikes list: the
 * measured distance, climbing, and (when the GPX had timestamps) elapsed time,
 * a small decorative elevation sparkline, and a GPX download of the actual
 * track. Self-contained and id-free so several can render in one list.
 */
export function RecordedTrackSummary({
  track,
  trailName,
}: {
  track: RecordedTrack;
  trailName: string;
}) {
  if (!track.points || track.points.length < 2) return null;

  const { points, totalMiles, gainFt, highFt, lowFt } = buildElevationProfile(
    track.points,
  );

  const W = 240;
  const H = 48;
  const span = highFt - lowFt || 1;
  const total = totalMiles || 1;
  const line = points
    .map((p) => {
      const x = (p.distanceMi / total) * W;
      const y = H - ((p.elevationFt - lowFt) / span) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // The plan-view shape of the actual track, beside the elevation profile, so a
  // hike is recognizable at a glance (#262). Empty for a track that never moved.
  const SHAPE = 48;
  const shape = routeShapePath(track.points, SHAPE, SHAPE, 3);

  const stats = [
    `${totalMiles.toFixed(1)} mi`,
    `${gainFt.toLocaleString()} ft climb`,
    ...(track.durationMin ? [formatDuration(track.durationMin)] : []),
  ].join(" · ");

  return (
    <div className="border-forest/10 bg-cream-50 mt-2 rounded-lg border p-3">
      <p className="text-olive text-xs font-semibold tracking-wider uppercase">
        Recorded track
      </p>
      <p className="text-ink/75 mt-0.5 text-sm">{stats}</p>
      <div className="mt-2 flex items-stretch gap-3">
        {shape ? (
          <svg
            viewBox={`0 0 ${SHAPE} ${SHAPE}`}
            aria-hidden="true"
            className="border-forest/10 bg-cream h-12 w-12 shrink-0 rounded border"
          >
            <polyline
              points={shape}
              fill="none"
              className="stroke-forest"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          preserveAspectRatio="none"
          className="h-12 flex-1"
        >
          <polyline
            points={line}
            fill="none"
            className="stroke-pine"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="mt-2">
        <DownloadGpx trail={{ name: trailName, route: track.points }} />
      </div>
    </div>
  );
}

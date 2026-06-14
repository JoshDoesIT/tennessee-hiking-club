"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
  removeHike,
} from "@/lib/hikes/local-log";
import { deleteRemotePhoto } from "@/lib/hikes/photo-upload";
import { computeStats } from "@/lib/hikes/stats";
import { HikePhoto } from "./hike-photo";
import { RecordedTrackSummary } from "./recorded-track-summary";
import { ContributeRecordedRoute } from "./contribute-recorded-route";
import type { HikeLogEntry } from "@/lib/hikes/types";
import type { Trail } from "@/lib/trails/schema";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format an ISO `yyyy-mm-dd` as e.g. "Jan 1, 2026", with no timezone surprises. */
function formatHikeDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Remove a single hike everywhere: the local log (which also GCs its local
 *  photo), the account when signed in, and any remote photo. */
function deleteHike(entry: HikeLogEntry) {
  removeHike(entry.trailSlug, entry.hikedOn);
  if (entry.photoUrl) void deleteRemotePhoto(entry.photoUrl);
  void fetch("/api/hikes/sync", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trailSlug: entry.trailSlug,
      hikedOn: entry.hikedOn,
    }),
  }).catch(() => {});
}

export function MyHikes({ trails }: { trails: Trail[] }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );

  if (log.length === 0) {
    return (
      <div className="border-forest/15 rounded-2xl border border-dashed p-10 text-center">
        <p className="text-forest font-medium">No hikes logged yet.</p>
        <p className="text-ink/70 mt-1 text-sm">
          Open any trail and tap Mark as hiked to start your Tennessee.
        </p>
        <Link
          href="/trails"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-4",
          )}
        >
          Browse trails
        </Link>
      </div>
    );
  }

  const stats = computeStats(log, trails);
  const bySlug = new Map(trails.map((t) => [t.slug, t]));

  // Each logged hike, newest first; same-day hikes keep their logged order.
  const rows = log
    .map((entry, index) => ({ entry, index, trail: bySlug.get(entry.trailSlug) }))
    .filter((r): r is { entry: HikeLogEntry; index: number; trail: Trail } =>
      Boolean(r.trail),
    )
    .sort(
      (a, b) =>
        b.entry.hikedOn.localeCompare(a.entry.hikedOn) || b.index - a.index,
    );

  return (
    <div>
      <dl className="border-forest/10 bg-cream-50 grid grid-cols-2 gap-4 rounded-2xl border p-5 sm:grid-cols-4">
        <Stat label="Hikes" value={stats.hikes} />
        <Stat label="Trails" value={stats.trails} />
        <Stat label="Miles" value={`${stats.miles} mi`} />
        <Stat label="Divisions" value={`${stats.regions.length} of 3`} />
      </dl>

      <h2 className="text-olive mt-8 text-xs font-semibold tracking-wider uppercase">
        Hike log
      </h2>
      <ul className="mt-3 space-y-3">
        {rows.map(({ entry, index, trail }) => (
          <li
            key={`${entry.trailSlug}-${entry.hikedOn}-${index}`}
            className="border-forest/10 bg-cream-50 rounded-2xl border p-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <Link
                href={`/trails/${trail.slug}`}
                className="text-pine hover:text-forest font-medium underline-offset-4 hover:underline"
              >
                {trail.name}
              </Link>
              <span className="text-ink/70 shrink-0 text-sm">
                {formatHikeDate(entry.hikedOn)}
              </span>
            </div>
            <p className="text-ink/50 text-xs">{trail.region} TN</p>

            {entry.note || entry.conditions ? (
              <p className="mt-1 text-xs">
                {entry.conditions ? (
                  <span className="text-olive font-medium">
                    {entry.conditions}
                  </span>
                ) : null}
                {entry.conditions && entry.note ? (
                  <span className="text-ink/40"> &middot; </span>
                ) : null}
                {entry.note ? (
                  <span className="text-ink/70 italic">
                    &ldquo;{entry.note}&rdquo;
                  </span>
                ) : null}
              </p>
            ) : null}

            {entry.photoId || entry.photoUrl ? (
              <HikePhoto
                photoId={entry.photoId}
                photoUrl={entry.photoUrl}
                alt={`Photo from your hike of ${trail.name}`}
                className="border-forest/10 mt-2 h-28 w-full rounded-lg border object-cover"
              />
            ) : null}

            {entry.track && entry.track.points.length > 1 ? (
              <>
                <RecordedTrackSummary
                  track={entry.track}
                  trailName={trail.name}
                />
                <ContributeRecordedRoute
                  trailSlug={entry.trailSlug}
                  trailName={trail.name}
                  points={entry.track.points}
                />
              </>
            ) : null}

            <div className="mt-3">
              <button
                type="button"
                onClick={() => deleteHike(entry)}
                aria-label={`Delete your ${trail.name} hike on ${formatHikeDate(entry.hikedOn)}`}
                className="text-ink/50 hover:text-forest text-xs font-medium underline-offset-4 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-olive text-xs font-semibold tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-forest mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  );
}

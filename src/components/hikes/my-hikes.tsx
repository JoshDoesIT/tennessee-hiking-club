"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
} from "@/lib/hikes/local-log";
import { computeStats } from "@/lib/hikes/stats";
import type { Trail } from "@/lib/trails/schema";

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
  const distinct = [...new Set(log.map((e) => e.trailSlug))].filter((s) =>
    bySlug.has(s),
  );

  return (
    <div>
      <dl className="border-forest/10 bg-cream-50 grid grid-cols-2 gap-4 rounded-2xl border p-5 sm:grid-cols-4">
        <Stat label="Hikes" value={stats.hikes} />
        <Stat label="Trails" value={stats.trails} />
        <Stat label="Miles" value={`${stats.miles} mi`} />
        <Stat label="Divisions" value={`${stats.regions.length} of 3`} />
      </dl>

      <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {distinct.map((slug) => {
          const trail = bySlug.get(slug)!;
          const count = log.filter((e) => e.trailSlug === slug).length;
          return (
            <li
              key={slug}
              className="border-forest/5 flex items-baseline justify-between gap-3 border-b py-1.5"
            >
              <Link
                href={`/trails/${slug}`}
                className="text-pine hover:text-forest font-medium underline-offset-4 hover:underline"
              >
                {trail.name}
              </Link>
              <span className="text-ink/70 shrink-0 text-sm">
                {trail.region} TN{count > 1 ? ` · ${count}x` : ""}
              </span>
            </li>
          );
        })}
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

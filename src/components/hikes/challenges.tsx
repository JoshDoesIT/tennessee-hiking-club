"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
} from "@/lib/hikes/local-log";
import {
  CHALLENGES,
  evaluateChallenge,
  type Challenge,
  type ChallengeProgress,
} from "@/lib/hikes/challenges";
import type { Trail } from "@/lib/trails/schema";

/**
 * Tennessee-themed challenges on "Your Tennessee": earned badges plus progress
 * bars for the rest. Progress is derived from the local hike log, so it works
 * before sign-in; sharing arrives with accounts.
 */
export function Challenges({ trails }: { trails: Trail[] }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );
  const completedSlugs = log.map((e) => e.trailSlug);

  const items = CHALLENGES.map((challenge) => ({
    challenge,
    ...evaluateChallenge(challenge, completedSlugs, trails),
  })).sort((a, b) => {
    if (a.done !== b.done) return a.done ? -1 : 1;
    return b.progress / b.total - a.progress / a.total;
  });

  const earned = items.filter((i) => i.done).length;

  return (
    <section aria-labelledby="challenges-heading" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="challenges-heading"
          className="display text-forest text-2xl sm:text-3xl"
        >
          Challenges
        </h2>
        <p className="text-olive text-sm font-medium">
          {earned} of {items.length} earned
        </p>
      </div>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        Badges for exploring Tennessee&rsquo;s regions, parks, and seasons.
        Breadth over raw mileage.
      </p>

      <ul role="list" className="mt-5 grid gap-4 sm:grid-cols-2">
        {items.map(({ challenge, done, progress, total }) => (
          <ChallengeCard
            key={challenge.slug}
            challenge={challenge}
            done={done}
            progress={progress}
            total={total}
          />
        ))}
      </ul>
    </section>
  );
}

function ChallengeCard({
  challenge,
  done,
  progress,
  total,
}: { challenge: Challenge } & ChallengeProgress) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <li
      className={cn(
        "rounded-2xl border p-5",
        done ? "border-amber/40 bg-amber/10" : "border-forest/10 bg-cream-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-forest font-semibold">{challenge.name}</h3>
        {done ? (
          <Badge variant="forest">Earned</Badge>
        ) : challenge.season ? (
          <Badge variant="outline">{challenge.season}</Badge>
        ) : null}
      </div>
      <p className="text-ink/70 mt-1 text-sm leading-relaxed">
        {challenge.description}
      </p>

      {done ? (
        <p className="text-pine mt-4 flex items-center gap-1.5 text-sm font-medium">
          <CheckIcon />
          Completed
        </p>
      ) : (
        <div className="mt-4">
          <div
            role="progressbar"
            aria-label={`${challenge.name}: ${progress} of ${total} complete`}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={total}
            className="bg-forest/10 h-2 overflow-hidden rounded-full"
          >
            <div
              className="bg-amber h-full rounded-full transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-ink/70 mt-1.5 text-xs">
            {progress} of {total}
          </p>
        </div>
      )}
    </li>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="text-amber-700"
    >
      <path
        d="M3 8.5l3.5 3.5L13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

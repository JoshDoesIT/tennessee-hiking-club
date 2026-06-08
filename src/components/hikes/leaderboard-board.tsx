"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  rankLeaderboard,
  type LeaderboardEntry,
  type LeaderboardMetric,
  type LeaderboardWindow,
} from "@/lib/hikes/leaderboard";

const METRICS: { key: LeaderboardMetric; label: string; unit: string }[] = [
  { key: "trails", label: "Distinct trails", unit: "trails" },
  { key: "regions", label: "Grand Divisions", unit: "of 3" },
  { key: "challenges", label: "Challenges", unit: "earned" },
  { key: "contributions", label: "Stewardship", unit: "cleanup days" },
  { key: "trailsContributed", label: "Trails contributed", unit: "trails" },
  { key: "conditionsReported", label: "Conditions reported", unit: "reports" },
  { key: "photoCredits", label: "Photos contributed", unit: "photos" },
];

const WINDOWS: { key: LeaderboardWindow; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "year", label: "This year" },
];

const SCOPES = [
  { key: "public", label: "Everyone" },
  { key: "friends", label: "Friends" },
] as const;

/**
 * The leaderboard's interactive board, fetched client-side so the page can be a
 * static export bundled into the native app (#308, spec 0009). The metric,
 * window, and scope live in the URL (shareable); changing the window or scope
 * refetches `GET /api/leaderboard`, while changing the metric re-ranks the same
 * data on the device. Offline the fetch fails and the board reads empty.
 */
export function LeaderboardBoard() {
  const searchParams = useSearchParams();
  const rawMetric = searchParams.get("metric");
  const metric: LeaderboardMetric = METRICS.some((m) => m.key === rawMetric)
    ? (rawMetric as LeaderboardMetric)
    : "trails";
  const unit = METRICS.find((m) => m.key === metric)!.unit;
  const window: LeaderboardWindow =
    searchParams.get("window") === "year" ? "year" : "all";
  const scope: "public" | "friends" =
    searchParams.get("scope") === "friends" ? "friends" : "public";

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  // `loading` is derived (not set synchronously in the effect): the board is
  // loading until the data for the current scope+window has come back.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const key = `${scope}:${window}`;
  const loading = loadedKey !== key;

  useEffect(() => {
    let active = true;
    fetch(`/api/leaderboard?scope=${scope}&window=${window}`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data: { entries?: LeaderboardEntry[]; needsSignIn?: boolean }) => {
        if (!active) return;
        setEntries(data.entries ?? []);
        setNeedsSignIn(Boolean(data.needsSignIn));
        setLoadedKey(`${scope}:${window}`);
      })
      .catch(() => {
        if (!active) return;
        setEntries([]);
        setNeedsSignIn(false);
        setLoadedKey(`${scope}:${window}`);
      });
    return () => {
      active = false;
    };
  }, [scope, window]);

  const ranked = rankLeaderboard(entries, metric);
  const link = (over: { metric?: string; window?: string; scope?: string }) =>
    `/leaderboard?metric=${over.metric ?? metric}&window=${over.window ?? window}&scope=${over.scope ?? scope}`;

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Board scope">
        {SCOPES.map((s) => (
          <Link
            key={s.key}
            href={link({ scope: s.key })}
            aria-current={s.key === scope ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold",
              s.key === scope
                ? "border-amber-600 bg-amber/10 text-amber-700"
                : "border-forest/20 text-forest hover:bg-forest/5",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Ranking metric">
        {METRICS.map((m) => (
          <Link
            key={m.key}
            href={link({ metric: m.key })}
            aria-current={m.key === metric ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              m.key === metric
                ? "border-forest bg-forest text-cream"
                : "border-forest/20 text-forest hover:bg-forest/5",
            )}
          >
            {m.label}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Time window">
        {WINDOWS.map((w) => (
          <Link
            key={w.key}
            href={link({ window: w.key })}
            aria-current={w.key === window ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              w.key === window
                ? "border-pine bg-pine text-cream"
                : "border-forest/15 text-ink/70 hover:bg-forest/5",
            )}
          >
            {w.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/60 mt-8 text-center text-sm">
          Loading the board…
        </p>
      ) : needsSignIn ? (
        <div className="border-forest/15 mt-8 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-forest font-medium">Sign in to see your friends.</p>
          <p className="text-ink/70 mt-1 text-sm">
            The friends board is private to you. Sign in and add friends from{" "}
            <Link
              href="/hikes"
              className="text-pine hover:text-forest underline underline-offset-4"
            >
              My hikes
            </Link>
            .
          </p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="border-forest/15 mt-8 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-forest font-medium">
            {scope === "friends"
              ? "No friends on your board yet."
              : "No hikers on the board yet."}
          </p>
          <p className="text-ink/70 mt-1 text-sm">
            {scope === "friends"
              ? "Add friends from My hikes; you will see each other here once they accept."
              : "Sign in from My hikes and switch on the leaderboard to be the first."}
          </p>
        </div>
      ) : (
        <ol className="mt-6 space-y-2">
          {ranked.map((entry) => (
            <li
              key={`${entry.user}-${entry.rank}`}
              className="border-forest/10 bg-cream-50 flex items-center gap-4 rounded-xl border px-4 py-3"
            >
              <span className="text-olive w-8 shrink-0 text-lg font-semibold tabular-nums">
                {entry.rank}
              </span>
              <span className="text-forest flex-1 font-medium">
                {entry.user}
              </span>
              <span className="text-ink/80 text-sm">
                <span className="text-forest font-semibold">
                  {entry[metric]}
                </span>{" "}
                {unit}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

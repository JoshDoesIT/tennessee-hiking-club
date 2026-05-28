import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { eq, inArray } from "drizzle-orm";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { getDb } from "@/lib/db";
import {
  profiles,
  hikes as hikesTable,
  cleanups as cleanupsTable,
} from "@/lib/db/schema";
import { getAllTrails } from "@/lib/trails";
import {
  leaderboardEntry,
  rankLeaderboard,
  filterHikesByWindow,
  filterCleanupsByWindow,
  type LeaderboardEntry,
  type LeaderboardMetric,
  type LeaderboardWindow,
} from "@/lib/hikes/leaderboard";
import { rowToEntry } from "@/lib/hikes/sync";
import { rowToCleanup } from "@/lib/stewardship/cleanups-sync";

// Reads opted-in profiles at request time; never prerendered (and harmless
// without a database, which keeps CI builds green).
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Leaderboard",
  description:
    "A friendly, opt-in leaderboard that celebrates exploring Tennessee widely, not raw mileage.",
  path: "/leaderboard",
});

const METRICS: { key: LeaderboardMetric; label: string; unit: string }[] = [
  { key: "trails", label: "Distinct trails", unit: "trails" },
  { key: "regions", label: "Grand Divisions", unit: "of 3" },
  { key: "challenges", label: "Challenges", unit: "earned" },
  { key: "contributions", label: "Stewardship", unit: "cleanup days" },
];

const WINDOWS: { key: LeaderboardWindow; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "year", label: "This year" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function loadEntries(
  window: LeaderboardWindow,
): Promise<LeaderboardEntry[]> {
  try {
    const db = getDb();
    const opted = await db
      .select()
      .from(profiles)
      .where(eq(profiles.isPublic, true));
    if (opted.length === 0) return [];

    const ids = opted.map((p) => p.userId);
    const [hikeRows, cleanupRows] = await Promise.all([
      db.select().from(hikesTable).where(inArray(hikesTable.userId, ids)),
      db.select().from(cleanupsTable).where(inArray(cleanupsTable.userId, ids)),
    ]);

    const hikesByUser = new Map<string, ReturnType<typeof rowToEntry>[]>();
    for (const row of hikeRows) {
      const list = hikesByUser.get(row.userId) ?? [];
      list.push(rowToEntry(row));
      hikesByUser.set(row.userId, list);
    }

    const cleanupsByUser = new Map<
      string,
      ReturnType<typeof rowToCleanup>[]
    >();
    for (const row of cleanupRows) {
      const list = cleanupsByUser.get(row.userId) ?? [];
      list.push(rowToCleanup(row));
      cleanupsByUser.set(row.userId, list);
    }

    const trails = getAllTrails();
    return opted.map((p) => {
      const userCleanups = filterCleanupsByWindow(
        cleanupsByUser.get(p.userId) ?? [],
        window,
      );
      const contributions = new Set(userCleanups.map((c) => c.loggedOn)).size;
      return leaderboardEntry(
        p.displayName || "Anonymous hiker",
        filterHikesByWindow(hikesByUser.get(p.userId) ?? [], window),
        trails,
        contributions,
      );
    });
  } catch {
    return [];
  }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.metric) ? params.metric[0] : params.metric;
  const metric: LeaderboardMetric = METRICS.some((m) => m.key === raw)
    ? (raw as LeaderboardMetric)
    : "trails";
  const unit = METRICS.find((m) => m.key === metric)!.unit;

  const rawWindow = Array.isArray(params.window)
    ? params.window[0]
    : params.window;
  const window: LeaderboardWindow = rawWindow === "year" ? "year" : "all";

  const ranked = rankLeaderboard(await loadEntries(window), metric);

  return (
    <Container className="max-w-2xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Community</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Leaderboard
      </h1>
      <p className="text-ink/70 mt-4 leading-relaxed">
        A friendly board that rewards exploring widely, not logging the most
        miles. Opt in from{" "}
        <Link
          href="/hikes"
          className="text-pine hover:text-forest underline underline-offset-4"
        >
          My hikes
        </Link>
        .
      </p>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Ranking metric">
        {METRICS.map((m) => (
          <Link
            key={m.key}
            href={`/leaderboard?metric=${m.key}&window=${window}`}
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
            href={`/leaderboard?metric=${metric}&window=${w.key}`}
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

      {ranked.length === 0 ? (
        <div className="border-forest/15 mt-8 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-forest font-medium">No hikers on the board yet.</p>
          <p className="text-ink/70 mt-1 text-sm">
            Sign in from My hikes and switch on the leaderboard to be the first.
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
    </Container>
  );
}

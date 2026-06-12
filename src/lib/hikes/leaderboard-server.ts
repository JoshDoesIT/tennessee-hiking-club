import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  profiles,
  hikes as hikesTable,
  cleanups as cleanupsTable,
  type ProfileRow,
} from "@/lib/db/schema";
import { getFriendCircleIds } from "@/lib/friends/friends-server";
import { getAllTrails } from "@/lib/trails";
import {
  leaderboardEntry,
  filterHikesByWindow,
  filterCleanupsByWindow,
  type LeaderboardEntry,
  type LeaderboardWindow,
} from "@/lib/hikes/leaderboard";
import { rowToEntry } from "@/lib/hikes/sync";
import { rowToCleanup } from "@/lib/stewardship/cleanups-sync";
import { aggregateContributions } from "@/lib/trails/contributions";
import { getApprovedSubmissionCounts } from "@/lib/contributions/submissions-server";
import { getApprovedConditionCounts } from "@/lib/contributions/conditions-server";
import { getApprovedPhotoCounts } from "@/lib/contributions/photos-server";

/**
 * The leaderboard's data loaders, behind `GET /api/leaderboard` so the page can
 * be a static export that fetches its data client-side (#308, spec 0009). The
 * page used to call these directly at request time; the logic is unchanged.
 */

/** Build ranked-able entries for a set of profiles (public board or friends). */
async function buildEntries(
  people: ProfileRow[],
  window: LeaderboardWindow,
  fallbackName: string,
): Promise<LeaderboardEntry[]> {
  if (people.length === 0) return [];
  const opted = people;
  const db = getDb();
  const ids = opted.map((p) => p.userId);
  const [
    hikeRows,
    cleanupRows,
    submissionCounts,
    conditionCounts,
    photoCounts,
  ] = await Promise.all([
    db.select().from(hikesTable).where(inArray(hikesTable.userId, ids)),
    db.select().from(cleanupsTable).where(inArray(cleanupsTable.userId, ids)),
    getApprovedSubmissionCounts(ids),
    getApprovedConditionCounts(ids),
    getApprovedPhotoCounts(ids),
  ]);

  const hikesByUser = new Map<string, ReturnType<typeof rowToEntry>[]>();
  for (const row of hikeRows) {
    const list = hikesByUser.get(row.userId) ?? [];
    list.push(rowToEntry(row));
    hikesByUser.set(row.userId, list);
  }

  const cleanupsByUser = new Map<string, ReturnType<typeof rowToCleanup>[]>();
  for (const row of cleanupRows) {
    const list = cleanupsByUser.get(row.userId) ?? [];
    list.push(rowToCleanup(row));
    cleanupsByUser.set(row.userId, list);
  }

  const trails = getAllTrails();
  const contributionsByHandle = aggregateContributions(trails);
  return opted.map((p) => {
    const userCleanups = filterCleanupsByWindow(
      cleanupsByUser.get(p.userId) ?? [],
      window,
    );
    const contributions = new Set(userCleanups.map((c) => c.loggedOn)).size;
    // Contributions are attributed by the user's captured GitHub login; they are
    // all-time (not windowed by date). Approved in-app submissions (#146) are
    // credited by userId and count toward trails contributed.
    const counts = p.githubLogin
      ? contributionsByHandle.get(p.githubLogin.toLowerCase())
      : undefined;
    const trailsContributed =
      (counts?.trailsContributed ?? 0) + (submissionCounts.get(p.userId) ?? 0);
    const conditionsReported =
      (counts?.conditionsReported ?? 0) + (conditionCounts.get(p.userId) ?? 0);
    const photoCredits =
      (counts?.photoCredits ?? 0) + (photoCounts.get(p.userId) ?? 0);
    return leaderboardEntry(
      p.displayName || fallbackName,
      filterHikesByWindow(hikesByUser.get(p.userId) ?? [], window),
      trails,
      contributions,
      trailsContributed,
      conditionsReported,
      photoCredits,
    );
  });
}

/** The opt-in public board: everyone with `isPublic`. */
export async function loadPublicEntries(
  window: LeaderboardWindow,
): Promise<LeaderboardEntry[]> {
  try {
    const db = getDb();
    const opted = await db
      .select()
      .from(profiles)
      .where(eq(profiles.isPublic, true));
    return buildEntries(opted, window, "Anonymous hiker");
  } catch {
    return [];
  }
}

/** The friends board: the viewer plus their accepted friends, regardless of
 *  `isPublic` (mutual friendship is the consent). */
export async function loadFriendEntries(
  userId: string,
  window: LeaderboardWindow,
): Promise<LeaderboardEntry[]> {
  try {
    const ids = await getFriendCircleIds(userId);
    const db = getDb();
    const people = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.userId, ids));
    return buildEntries(people, window, "A friend");
  } catch {
    return [];
  }
}

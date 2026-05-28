import type { Cleanup } from "./cleanups";

/**
 * Account sync for the cleanup log, mirroring the hike sync but simpler:
 * cleanups are one credit per day, so a day is the identity. Merging and
 * planning are pure and de-duplicate by day, which makes re-syncing a no-op
 * and keeps the stewardship count ungameable (logging twice in a day is one).
 */
export function mergeCleanups(a: Cleanup[], b: Cleanup[]): Cleanup[] {
  const byDay = new Map<string, Cleanup>();
  for (const c of [...a, ...b]) {
    if (!byDay.has(c.loggedOn)) byDay.set(c.loggedOn, { loggedOn: c.loggedOn });
  }
  return [...byDay.values()].sort((x, y) =>
    x.loggedOn.localeCompare(y.loggedOn),
  );
}

/**
 * Decide what an account sync should do: which local cleanup-days the account
 * is missing (to insert) and the full merged log to hand back. Additive only,
 * so nothing is ever deleted.
 */
export function planCleanupSync(
  local: Cleanup[],
  remote: Cleanup[],
): { toInsert: Cleanup[]; merged: Cleanup[] } {
  const have = new Set(remote.map((c) => c.loggedOn));
  const toInsert: Cleanup[] = [];
  for (const c of local) {
    if (have.has(c.loggedOn)) continue;
    have.add(c.loggedOn);
    toInsert.push({ loggedOn: c.loggedOn });
  }
  return { toInsert, merged: mergeCleanups(local, remote) };
}

type CleanupRowLike = { loggedOn: string };

/** A database row to a cleanup. */
export function rowToCleanup(row: CleanupRowLike): Cleanup {
  return { loggedOn: row.loggedOn };
}

/** A cleanup to an insertable row for a given user. */
export function cleanupToInsert(userId: string, cleanup: Cleanup) {
  return { userId, loggedOn: cleanup.loggedOn };
}

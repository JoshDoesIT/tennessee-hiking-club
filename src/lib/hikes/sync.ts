import type { HikeLogEntry } from "./types";

/**
 * Merge two hike logs (e.g. the local device log and the account's stored
 * hikes) into one. Hikes are identified by trail + date, so the same trail on
 * different days stays distinct; when both sides have the same hike, their note
 * and conditions are combined (existing values win, gaps are filled). The
 * result is sorted by date. Pure, so it can drive both directions of sync.
 */
function keyOf(entry: HikeLogEntry): string {
  return `${entry.trailSlug}|${entry.hikedOn}`;
}

export function mergeHikes(
  a: HikeLogEntry[],
  b: HikeLogEntry[],
): HikeLogEntry[] {
  const byKey = new Map<string, HikeLogEntry>();

  for (const entry of [...a, ...b]) {
    const key = keyOf(entry);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...entry });
      continue;
    }
    byKey.set(key, {
      ...existing,
      note: existing.note ?? entry.note,
      conditions: existing.conditions ?? entry.conditions,
    });
  }

  return [...byKey.values()].sort((x, y) => x.hikedOn.localeCompare(y.hikedOn));
}

/**
 * Decide what an account sync should do: which local hikes are missing from the
 * account (to insert) and the full merged log to hand back to the client. Only
 * additions are made, so sync never deletes a hike.
 */
export function planSync(
  local: HikeLogEntry[],
  remote: HikeLogEntry[],
): { toInsert: HikeLogEntry[]; merged: HikeLogEntry[] } {
  const remoteKeys = new Set(remote.map(keyOf));
  return {
    toInsert: local.filter((e) => !remoteKeys.has(keyOf(e))),
    merged: mergeHikes(local, remote),
  };
}

type HikeRowLike = {
  trailSlug: string;
  hikedOn: string;
  note: string | null;
  conditions: string | null;
};

/** A database row to a log entry (dropping null note/conditions). */
export function rowToEntry(row: HikeRowLike): HikeLogEntry {
  const entry: HikeLogEntry = {
    trailSlug: row.trailSlug,
    hikedOn: row.hikedOn,
  };
  if (row.note) entry.note = row.note;
  if (row.conditions) entry.conditions = row.conditions;
  return entry;
}

/** A log entry to an insertable row for a given user. */
export function entryToInsert(userId: string, entry: HikeLogEntry) {
  return {
    userId,
    trailSlug: entry.trailSlug,
    hikedOn: entry.hikedOn,
    note: entry.note ?? null,
    conditions: entry.conditions ?? null,
  };
}

import type { HikeLogEntry } from "./types";
import type { RoutePoint } from "@/lib/trails/elevation";

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
      photoId: existing.photoId ?? entry.photoId,
      photoUrl: existing.photoUrl ?? entry.photoUrl,
      track: existing.track ?? entry.track,
    });
  }

  return [...byKey.values()].sort((x, y) => x.hikedOn.localeCompare(y.hikedOn));
}

/**
 * Decide what an account sync should do: which local hikes are missing from the
 * account (to insert) and the full merged log to hand back to the client. Only
 * additions are made, so sync never deletes a hike.
 */
/** A photo URL to backfill onto an existing remote hike that lacks one. */
export type PhotoBackfill = {
  trailSlug: string;
  hikedOn: string;
  photoUrl: string;
};

export function planSync(
  local: HikeLogEntry[],
  remote: HikeLogEntry[],
): {
  toInsert: HikeLogEntry[];
  toUpdate: PhotoBackfill[];
  merged: HikeLogEntry[];
} {
  const remoteByKey = new Map(remote.map((e) => [keyOf(e), e]));
  const toInsert = local.filter((e) => !remoteByKey.has(keyOf(e)));

  // Backfill: the account has the hike but no photo, and this device does have
  // one. Additive — an existing remote photoUrl is never overwritten.
  const toUpdate: PhotoBackfill[] = [];
  for (const entry of local) {
    if (!entry.photoUrl) continue;
    const remoteEntry = remoteByKey.get(keyOf(entry));
    if (remoteEntry && !remoteEntry.photoUrl) {
      toUpdate.push({
        trailSlug: entry.trailSlug,
        hikedOn: entry.hikedOn,
        photoUrl: entry.photoUrl,
      });
    }
  }

  return { toInsert, toUpdate, merged: mergeHikes(local, remote) };
}

type HikeRowLike = {
  trailSlug: string;
  hikedOn: string;
  note: string | null;
  conditions: string | null;
  photoUrl: string | null;
  /** JSON-encoded recorded track points; optional so a pre-migration row maps. */
  route?: string | null;
  trackDurationMin?: number | null;
};

/** A database row to a log entry (dropping null note/conditions/photoUrl, and
 *  rebuilding a recorded track from the stored route JSON when present). */
export function rowToEntry(row: HikeRowLike): HikeLogEntry {
  const entry: HikeLogEntry = {
    trailSlug: row.trailSlug,
    hikedOn: row.hikedOn,
  };
  if (row.note) entry.note = row.note;
  if (row.conditions) entry.conditions = row.conditions;
  if (row.photoUrl) entry.photoUrl = row.photoUrl;
  if (row.route) {
    try {
      const points = JSON.parse(row.route) as RoutePoint[];
      if (Array.isArray(points) && points.length > 0) {
        entry.track = { points };
        if (row.trackDurationMin != null) {
          entry.track.durationMin = row.trackDurationMin;
        }
      }
    } catch {
      // Ignore a malformed stored track; the rest of the hike still syncs.
    }
  }
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
    photoUrl: entry.photoUrl ?? null,
    route: entry.track ? JSON.stringify(entry.track.points) : null,
    trackDurationMin: entry.track?.durationMin ?? null,
  };
}

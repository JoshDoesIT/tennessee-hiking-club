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

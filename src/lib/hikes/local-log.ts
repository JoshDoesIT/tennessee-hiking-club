import type { HikeLogEntry, RecordedTrack } from "./types";
import { deletePhoto } from "./photo-store";
import { entryPhotoIds } from "./entry-photos";

/**
 * The hike log, stored in the browser. Local-first: it never leaves the device
 * unless the user signs in (accounts/sync are a later phase). `storage` is
 * injectable for tests; in the browser it defaults to `localStorage`, and on
 * the server it is a no-op so the module is safe to import anywhere.
 *
 * Components read the log via `useSyncExternalStore(subscribe, getLogSnapshot,
 * getServerLogSnapshot)`, which is SSR-safe and avoids hydration mismatches.
 */
const KEY = "tnhc:hike-log";
const EMPTY_LOG: HikeLogEntry[] = [];

function store(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isEntry(x: unknown): x is HikeLogEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return typeof e.trailSlug === "string" && typeof e.hikedOn === "string";
}

function parseLog(raw: string | null): HikeLogEntry[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isEntry) : EMPTY_LOG;
  } catch {
    return EMPTY_LOG;
  }
}

export function readLog(storage?: Storage): HikeLogEntry[] {
  const s = store(storage);
  return s ? parseLog(s.getItem(KEY)) : EMPTY_LOG;
}

function writeLog(log: HikeLogEntry[], storage?: Storage): void {
  store(storage)?.setItem(KEY, JSON.stringify(log));
  emit();
}

export function isHiked(slug: string, storage?: Storage): boolean {
  return readLog(storage).some((e) => e.trailSlug === slug);
}

/** Record a hike (a trail may be logged more than once), optionally with a
 *  note and conditions. Empty details are dropped. Returns the new log. */
export function addHike(
  slug: string,
  date: string,
  details?: {
    note?: string;
    conditions?: string;
    photoId?: string;
    photoIds?: string[];
    track?: RecordedTrack;
  },
  storage?: Storage,
): HikeLogEntry[] {
  const entry: HikeLogEntry = { trailSlug: slug, hikedOn: date };
  const note = details?.note?.trim();
  if (note) entry.note = note;
  if (details?.conditions) entry.conditions = details.conditions;
  if (details?.photoId) entry.photoId = details.photoId;
  if (details?.photoIds?.length) entry.photoIds = details.photoIds;
  if (details?.track) entry.track = details.track;

  const next = [...readLog(storage), entry];
  writeLog(next, storage);
  return next;
}

/** Set the remote photo URL on the entry matching `slug`+`date`. Used after a
 *  photo uploads when signed in. No-op if no entry matches. Returns the log. */
export function setEntryPhotoUrl(
  slug: string,
  date: string,
  url: string,
  storage?: Storage,
): HikeLogEntry[] {
  const next = readLog(storage).map((e) =>
    e.trailSlug === slug && e.hikedOn === date ? { ...e, photoUrl: url } : e,
  );
  writeLog(next, storage);
  return next;
}

/** Set the remote photo URLs (aligned with `photoIds`) on the entry matching
 *  `slug`+`date`, after a multi-photo hike's photos upload. Returns the log. */
export function setEntryPhotoUrls(
  slug: string,
  date: string,
  urls: string[],
  storage?: Storage,
): HikeLogEntry[] {
  // Mirror the first uploaded URL onto the legacy `photoUrl` so cross-device
  // sync (which only carries a single URL) keeps working for the first photo.
  const first = urls.find((u) => u);
  const next = readLog(storage).map((e) =>
    e.trailSlug === slug && e.hikedOn === date
      ? { ...e, photoUrls: urls, ...(first ? { photoUrl: first } : {}) }
      : e,
  );
  writeLog(next, storage);
  return next;
}

/** Remove every logged entry for a trail. Returns the new log. Local photos
 *  for the removed entries are garbage-collected (best-effort). */
export function removeTrail(slug: string, storage?: Storage): HikeLogEntry[] {
  const current = readLog(storage);
  const next = current.filter((e) => e.trailSlug !== slug);
  writeLog(next, storage);
  for (const e of current) {
    if (e.trailSlug === slug) {
      for (const id of entryPhotoIds(e)) void deletePhoto(id);
    }
  }
  return next;
}

/** Remove a single logged hike (a trail on a specific date). Returns the new
 *  log; the entry's local photo is garbage-collected (best-effort). */
export function removeHike(
  slug: string,
  hikedOn: string,
  storage?: Storage,
): HikeLogEntry[] {
  const current = readLog(storage);
  const next = current.filter(
    (e) => !(e.trailSlug === slug && e.hikedOn === hikedOn),
  );
  writeLog(next, storage);
  for (const e of current) {
    if (e.trailSlug === slug && e.hikedOn === hikedOn) {
      for (const id of entryPhotoIds(e)) void deletePhoto(id);
    }
  }
  return next;
}

/** Replace the entire log (used by import). Returns the new log. */
export function replaceLog(
  log: HikeLogEntry[],
  storage?: Storage,
): HikeLogEntry[] {
  writeLog(log, storage);
  return log;
}

// --- External-store interface for useSyncExternalStore -------------------

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

let cache: { raw: string; value: HikeLogEntry[] } = {
  raw: "",
  value: EMPTY_LOG,
};

/** Cached snapshot so repeated reads return a stable reference. */
export function getLogSnapshot(): HikeLogEntry[] {
  const s = store();
  if (!s) return EMPTY_LOG;
  const raw = s.getItem(KEY) ?? "[]";
  if (raw !== cache.raw) cache = { raw, value: parseLog(raw) };
  return cache.value;
}

export function getServerLogSnapshot(): HikeLogEntry[] {
  return EMPTY_LOG;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) emit();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

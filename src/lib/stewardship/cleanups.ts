/**
 * A local log of trail cleanups (pack-it-out / litter pickups), stored on the
 * device like the hike log. Feeds the stewardship count surfaced on My hikes.
 */
const KEY = "thc:cleanups";

export type Cleanup = { loggedOn: string };
const EMPTY: Cleanup[] = [];

function store(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isCleanup(x: unknown): x is Cleanup {
  return Boolean(x) && typeof (x as Cleanup).loggedOn === "string";
}

function parse(raw: string | null): Cleanup[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isCleanup) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function getCleanups(storage?: Storage): Cleanup[] {
  const s = store(storage);
  return s ? parse(s.getItem(KEY)) : EMPTY;
}

export function logCleanup(date: string, storage?: Storage): Cleanup[] {
  const next = [...getCleanups(storage), { loggedOn: date }];
  store(storage)?.setItem(KEY, JSON.stringify(next));
  emit();
  return next;
}

// --- External-store interface for useSyncExternalStore -------------------

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

let cache: { raw: string; value: Cleanup[] } = { raw: " ", value: EMPTY };

export function getCleanupsSnapshot(): Cleanup[] {
  const s = store();
  if (!s) return EMPTY;
  const raw = s.getItem(KEY) ?? "[]";
  if (raw !== cache.raw) cache = { raw, value: parse(raw) };
  return cache.value;
}

export function getServerCleanupsSnapshot(): Cleanup[] {
  return EMPTY;
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

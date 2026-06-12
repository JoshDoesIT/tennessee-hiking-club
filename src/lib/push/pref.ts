/**
 * The member's push opt-in choice, stored on the device (#218, spec 0008). This
 * is a UI convenience: it remembers the toggle state and the device token so the
 * control reflects reality without a round-trip. The `push_subscriptions` row in
 * the database is the source of truth for whether delivery actually happens.
 *
 * Mirrors the other local stores (injectable `storage`, server-safe, snapshot
 * for `useSyncExternalStore`).
 */
export type PushPref = { optedIn: boolean; token?: string };

const KEY = "tnhc:push-optin";
const DEFAULT: PushPref = { optedIn: false };

function store(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function parse(raw: string | null): PushPref {
  try {
    const parsed = JSON.parse(raw ?? "");
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.optedIn === "boolean"
    ) {
      const pref: PushPref = { optedIn: parsed.optedIn };
      if (typeof parsed.token === "string") pref.token = parsed.token;
      return pref;
    }
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function readPushPref(storage?: Storage): PushPref {
  const s = store(storage);
  return s ? parse(s.getItem(KEY)) : DEFAULT;
}

export function setPushPref(pref: PushPref, storage?: Storage): PushPref {
  store(storage)?.setItem(KEY, JSON.stringify(pref));
  emit();
  return pref;
}

export function clearPushPref(storage?: Storage): PushPref {
  store(storage)?.setItem(KEY, JSON.stringify(DEFAULT));
  emit();
  return DEFAULT;
}

// --- External-store interface for useSyncExternalStore -------------------

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

let cache: { raw: string; value: PushPref } = { raw: "", value: DEFAULT };

export function getPushPrefSnapshot(): PushPref {
  const s = store();
  if (!s) return DEFAULT;
  const raw = s.getItem(KEY) ?? "";
  if (raw !== cache.raw) cache = { raw, value: parse(raw) };
  return cache.value;
}

export function getServerPushPrefSnapshot(): PushPref {
  return DEFAULT;
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

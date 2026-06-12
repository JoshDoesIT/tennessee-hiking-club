import { useSyncExternalStore } from "react";

/**
 * Remembers that the member has opted into sharing their location, so the
 * "where am I" control on every map (and the recording view) can light up
 * automatically instead of making them tap and re-share each time. The OS still
 * owns the actual permission; this is just the app-side convenience flag.
 *
 * Mirrors the other local stores (injectable `storage`, server-safe, snapshot
 * for `useSyncExternalStore`).
 */
const KEY = "tnhc:location-enabled";

function store(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function isLocationEnabled(storage?: Storage): boolean {
  return store(storage)?.getItem(KEY) === "1";
}

export function setLocationEnabled(enabled: boolean, storage?: Storage): void {
  store(storage)?.setItem(KEY, enabled ? "1" : "0");
  emit();
}

/** Wire a MapLibre GeolocateControl to the preference: record it the first time
 *  the member shares a position, and auto-activate the control on later maps if
 *  they already have. Only auto-triggers when previously enabled, so it never
 *  prompts unexpectedly. */
export function rememberAndApplyLocation(
  control: { on: (type: string, cb: () => void) => void; trigger: () => boolean },
  storage?: Storage,
): void {
  control.on("geolocate", () => setLocationEnabled(true, storage));
  if (isLocationEnabled(storage)) control.trigger();
}

// --- External-store interface for useSyncExternalStore -------------------

const listeners = new Set<() => void>();
function emit(): void {
  for (const listener of listeners) listener();
}

export function getLocationSnapshot(): boolean {
  return isLocationEnabled();
}

export function getServerLocationSnapshot(): boolean {
  return false;
}

export function subscribeLocation(listener: () => void): () => void {
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

export function useLocationEnabled(): boolean {
  return useSyncExternalStore(
    subscribeLocation,
    getLocationSnapshot,
    getServerLocationSnapshot,
  );
}

import { useSyncExternalStore } from "react";
import { haversineMiles } from "@/lib/trails/elevation";

/**
 * Remembers that the member has opted into sharing their location, so a map can
 * show a passive "you are here" dot without making them re-tap each time. The OS
 * still owns the actual permission; this is just the app-side convenience flag.
 *
 * Crucially, a remembered preference shows the dot but never moves the camera:
 * the map keeps its own framing (the whole state, or a trail's extent) instead
 * of zooming to the member. On a trail map the dot is shown only when they are
 * actually nearby, so a faraway member does not get a stray off-trail marker.
 *
 * Mirrors the other local stores (injectable `storage`, server-safe, snapshot
 * for `useSyncExternalStore`).
 */
const KEY = "tnhc:location-enabled";

export type LatLng = { lat: number; lng: number };

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

/** Record the opt-in the first time the member shares a position via the
 *  GeolocateControl button, so later maps can show a passive dot. Deliberately
 *  does NOT call `control.trigger()`: triggering puts MapLibre's control into
 *  active-lock and flies/zooms the camera to the member, which is the behaviour
 *  we are avoiding. The button still works for an explicit, user-initiated
 *  recenter. */
export function recordLocationOptIn(
  control: { on: (type: string, cb: () => void) => void },
  storage?: Storage,
): void {
  control.on("geolocate", () => setLocationEnabled(true, storage));
}

/** Decide whether, and where, to draw the passive location dot, never moving the
 *  camera. Returns the position to mark, or null to show nothing. Omit `near`
 *  (the main map) to always show the dot; pass a trail's center plus `maxMiles`
 *  to show it only when the member is actually in the area. */
export function userDotPlacement(opts: {
  enabled: boolean;
  user: LatLng | null;
  near?: LatLng;
  maxMiles?: number;
}): LatLng | null {
  if (!opts.enabled || !opts.user) return null;
  if (opts.near && haversineMiles(opts.user, opts.near) > (opts.maxMiles ?? 25))
    return null;
  return opts.user;
}

/** Read the member's position once (no camera move, no tracking) and resolve to
 *  where the passive dot belongs, or null. `enabled` and `geolocation` are
 *  injectable for tests; in the app they default to the stored preference and
 *  `navigator.geolocation`. */
export async function resolveUserDot(opts: {
  near?: LatLng;
  maxMiles?: number;
  enabled?: boolean;
  geolocation?: Geolocation;
}): Promise<LatLng | null> {
  const enabled = opts.enabled ?? isLocationEnabled();
  if (!enabled) return null;
  const geo =
    opts.geolocation ??
    (typeof navigator !== "undefined" ? navigator.geolocation : undefined);
  if (!geo) return null;

  const user = await new Promise<LatLng | null>((resolve) => {
    geo.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });

  return userDotPlacement({
    enabled: true,
    user,
    near: opts.near,
    maxMiles: opts.maxMiles,
  });
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

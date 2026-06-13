import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isLocationEnabled,
  setLocationEnabled,
  recordLocationOptIn,
  userDotPlacement,
  resolveUserDot,
} from "./location-pref";

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  } as unknown as Storage;
}

type GeolocateLike = {
  on: (type: string, cb: () => void) => void;
  trigger: () => boolean;
};

function fakeControl() {
  const handlers: Record<string, () => void> = {};
  const trigger = vi.fn(() => true);
  const control: GeolocateLike = {
    on: (type, cb) => void (handlers[type] = cb),
    trigger,
  };
  return { control, fire: (type: string) => handlers[type]?.(), trigger };
}

function fakeGeolocation(result: { lat: number; lng: number } | "denied") {
  return {
    getCurrentPosition: (
      success: (p: GeolocationPosition) => void,
      error?: (e: GeolocationPositionError) => void,
    ) => {
      if (result === "denied") error?.({} as GeolocationPositionError);
      else
        success({
          coords: { latitude: result.lat, longitude: result.lng },
        } as GeolocationPosition);
    },
    watchPosition: () => 0,
    clearWatch: () => {},
  } as unknown as Geolocation;
}

const NASHVILLE = { lat: 36.1627, lng: -86.7816 };
const NEARBY = { lat: 36.17, lng: -86.79 }; // ~1 mi from Nashville
const MEMPHIS = { lat: 35.1495, lng: -90.049 }; // ~200 mi away

let storage: Storage;
beforeEach(() => {
  storage = memStorage();
});

describe("location-pref", () => {
  it("defaults to off and persists when enabled", () => {
    expect(isLocationEnabled(storage)).toBe(false);
    setLocationEnabled(true, storage);
    expect(isLocationEnabled(storage)).toBe(true);
    setLocationEnabled(false, storage);
    expect(isLocationEnabled(storage)).toBe(false);
  });

  it("records the preference the first time the user shares location", () => {
    const { control, fire } = fakeControl();
    recordLocationOptIn(control, storage);
    expect(isLocationEnabled(storage)).toBe(false);
    fire("geolocate"); // the control reported a position
    expect(isLocationEnabled(storage)).toBe(true);
  });

  it("never auto-triggers the camera-moving locate, even when previously enabled", () => {
    setLocationEnabled(true, storage);
    const { control, trigger } = fakeControl();
    recordLocationOptIn(control, storage);
    expect(trigger).not.toHaveBeenCalled();
  });
});

describe("userDotPlacement", () => {
  it("shows the dot at the user position when enabled with no nearby limit (main map)", () => {
    expect(userDotPlacement({ enabled: true, user: NASHVILLE })).toEqual(
      NASHVILLE,
    );
  });

  it("hides the dot when the user is far from the trail's nearby limit", () => {
    expect(
      userDotPlacement({
        enabled: true,
        user: MEMPHIS,
        near: NASHVILLE,
        maxMiles: 25,
      }),
    ).toBeNull();
  });

  it("shows the dot when the user is within the trail's nearby limit", () => {
    expect(
      userDotPlacement({
        enabled: true,
        user: NEARBY,
        near: NASHVILLE,
        maxMiles: 25,
      }),
    ).toEqual(NEARBY);
  });

  it("shows nothing when disabled or no position is available", () => {
    expect(userDotPlacement({ enabled: false, user: NASHVILLE })).toBeNull();
    expect(userDotPlacement({ enabled: true, user: null })).toBeNull();
  });
});

describe("resolveUserDot", () => {
  it("resolves to the user position for the main map (no nearby limit)", async () => {
    expect(
      await resolveUserDot({
        enabled: true,
        geolocation: fakeGeolocation(NASHVILLE),
      }),
    ).toEqual(NASHVILLE);
  });

  it("omits the dot when location is disabled", async () => {
    expect(
      await resolveUserDot({
        enabled: false,
        geolocation: fakeGeolocation(NASHVILLE),
      }),
    ).toBeNull();
  });

  it("omits the dot when the user denies or has no position", async () => {
    expect(
      await resolveUserDot({
        enabled: true,
        geolocation: fakeGeolocation("denied"),
      }),
    ).toBeNull();
  });

  it("shows the dot on a trail map only when the user is nearby", async () => {
    expect(
      await resolveUserDot({
        enabled: true,
        near: NASHVILLE,
        maxMiles: 25,
        geolocation: fakeGeolocation(MEMPHIS),
      }),
    ).toBeNull();
    expect(
      await resolveUserDot({
        enabled: true,
        near: NASHVILLE,
        maxMiles: 25,
        geolocation: fakeGeolocation(NEARBY),
      }),
    ).toEqual(NEARBY);
  });
});

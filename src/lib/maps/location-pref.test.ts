import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isLocationEnabled,
  setLocationEnabled,
  rememberAndApplyLocation,
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
    rememberAndApplyLocation(control, storage);
    expect(isLocationEnabled(storage)).toBe(false);
    fire("geolocate"); // the control reported a position
    expect(isLocationEnabled(storage)).toBe(true);
  });

  it("auto-activates location on later maps once the preference is set", () => {
    setLocationEnabled(true, storage);
    const { control, trigger } = fakeControl();
    rememberAndApplyLocation(control, storage);
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it("does not auto-activate when the user has never shared location", () => {
    const { control, trigger } = fakeControl();
    rememberAndApplyLocation(control, storage);
    expect(trigger).not.toHaveBeenCalled();
  });
});

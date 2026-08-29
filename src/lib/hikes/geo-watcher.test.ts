import { describe, it, expect, vi, afterEach } from "vitest";
import { startLocationWatch } from "./geo-watcher";

// In jsdom, Capacitor.isNativePlatform() is false, so these exercise the web
// fallback (watchPosition). The native background-geolocation path is verified
// on a device.

function mockGeolocation() {
  let success: PositionCallback = () => {};
  let failure: PositionErrorCallback = () => {};
  const watchPosition = vi.fn(
    (s: PositionCallback, e: PositionErrorCallback) => {
      success = s;
      failure = e;
      return 42;
    },
  );
  const clearWatch = vi.fn();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { watchPosition, clearWatch },
  });
  return {
    watchPosition,
    clearWatch,
    emit: (lat: number, lng: number, altitude: number | null = null) =>
      success({
        coords: { latitude: lat, longitude: lng, altitude },
      } as GeolocationPosition),
    fail: () => failure({} as GeolocationPositionError),
  };
}

afterEach(() =>
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: undefined,
  }),
);

describe("startLocationWatch (web fallback)", () => {
  it("watches position and delivers route points, stopping on demand", async () => {
    const geo = mockGeolocation();
    const points: unknown[] = [];
    const stop = await startLocationWatch(
      (p) => points.push(p),
      () => {},
    );

    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    geo.emit(35.6, -83.45, 1000);
    expect(points).toEqual([{ lat: 35.6, lng: -83.45, elevationFt: 3281 }]);

    stop();
    expect(geo.clearWatch).toHaveBeenCalledWith(42);
  });

  it("reports an error when a location read fails", async () => {
    const geo = mockGeolocation();
    let message = "";
    await startLocationWatch(
      () => {},
      (m) => {
        message = m;
      },
    );
    geo.fail();
    expect(message).toMatch(/location/i);
  });

  it("reports when geolocation is unavailable, with a no-op stop", async () => {
    let message = "";
    const stop = await startLocationWatch(
      () => {},
      (m) => {
        message = m;
      },
    );
    expect(message).toMatch(/available/i);
    expect(() => stop()).not.toThrow();
  });
});

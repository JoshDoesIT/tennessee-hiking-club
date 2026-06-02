import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { positionToPoint } from "./track";
import type { RoutePoint } from "@/lib/trails/elevation";

export type StopWatch = () => void;

// The community plugin ships only native code and type definitions; the JS side
// is a thin bridge registered here. `import type` above is erased at build time,
// so the web bundle never tries to load native-only code.
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

/**
 * Watch the device location for hike recording (#216). On a native build this
 * uses a background-capable plugin so recording keeps going with the screen off
 * and the app backgrounded; on the web it falls back to the foreground-only
 * Geolocation API (which the in-browser recorder has always used). Either way
 * each fix is delivered to `onPoint` as a route point, and the returned function
 * stops the watch.
 */
export async function startLocationWatch(
  onPoint: (point: RoutePoint) => void,
  onError: (message: string) => void,
): Promise<StopWatch> {
  if (Capacitor.isNativePlatform()) {
    const id = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: "Recording your hike",
        backgroundMessage: "Tennessee Hiking Club is tracking your route.",
        requestPermissions: true,
        // Deliver fresh fixes, not the last cached one, and only every few
        // metres so a long hike stays a manageable number of points.
        stale: false,
        distanceFilter: 5,
      },
      (location, error) => {
        if (error) {
          onError(
            "Couldn’t read your location. Allow location access set to “Always”.",
          );
          return;
        }
        if (location) {
          onPoint(
            positionToPoint({
              latitude: location.latitude,
              longitude: location.longitude,
              altitude: location.altitude ?? null,
            }),
          );
        }
      },
    );
    return () => {
      void BackgroundGeolocation.removeWatcher({ id });
    };
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError("Location isn’t available on this device.");
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => onPoint(positionToPoint(pos.coords)),
    () =>
      onError(
        "Couldn’t read your location. Check location permission and try again.",
      ),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}

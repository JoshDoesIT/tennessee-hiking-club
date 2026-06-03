import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

// Whether the app is running in the native Capacitor shell (vs the website).
// It never changes within a session, and is read SSR-safely: the server and the
// first client render both see `false`, so there is no hydration mismatch.
const noopSubscribe = () => () => {};

export function useIsNative(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => Capacitor.isNativePlatform(),
    () => false,
  );
}

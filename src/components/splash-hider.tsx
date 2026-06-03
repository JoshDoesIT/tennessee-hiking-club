"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Hide the launch splash once the web app has mounted (#246). The splash is
 * configured not to auto-hide (capacitor.config.ts), so it covers the whole
 * native launch + hosted-app load with the brand colour instead of a black
 * flash, and this hides it the moment the app is interactive. Renders nothing.
 *
 * If the app is offline at a cold launch and never loads, this never runs and
 * the branded splash stays up rather than going black (the real offline-launch
 * fix is the local bundle, #248).
 */
export function SplashHider() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void SplashScreen.hide().catch(() => undefined);
  }, []);

  return null;
}

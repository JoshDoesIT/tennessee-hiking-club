"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/**
 * Wire the Android hardware back button and edge swipe-back to in-app
 * navigation (#291). The app registers no back handler otherwise, so on Android
 * the back gesture does nothing useful; here we step back through history and
 * exit at the root. Native only; the browser's own back button handles the web.
 * Renders nothing.
 */
export function NativeBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove = () => {};
    void App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack ?? window.history.length > 1) {
        window.history.back();
      } else {
        void App.exitApp();
      }
    }).then((handle) => {
      remove = () => void handle.remove();
    });

    return () => remove();
  }, []);

  return null;
}

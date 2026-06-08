"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { DecorBackground } from "@/lib/native/decor-background";

// The page background per theme (matches --color-cream light/dark in
// globals.css). On Android 15 the app draws edge-to-edge and the area behind the
// transparent system bars is the window decor background; a static theme value
// can't follow the app's in-app dark toggle, so we set it at runtime here (#294).
const CREAM = "#fbf6e9";
const NIGHT = "#161a12";

/**
 * Keep the Android system-bar background in step with the app's theme, so dark
 * mode doesn't leave cream strips at the top and bottom. Android only (iOS draws
 * its own edge-to-edge); renders nothing.
 */
export function NativeEdgeToEdge() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    const apply = () => {
      const dark = document.documentElement.classList.contains("dark");
      void DecorBackground.setColor({ color: dark ? NIGHT : CREAM }).catch(
        () => undefined,
      );
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}

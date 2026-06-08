import { registerPlugin } from "@capacitor/core";

/**
 * Local Android plugin (`DecorBackgroundPlugin.java`) that sets the window decor
 * background colour at runtime, so the edge-to-edge area behind the system bars
 * can follow the app's in-app theme (#294).
 */
export interface DecorBackgroundPlugin {
  setColor(options: { color: string }): Promise<void>;
}

export const DecorBackground =
  registerPlugin<DecorBackgroundPlugin>("DecorBackground");

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const getPlatform = vi.hoisted(() => vi.fn(() => "android"));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform } }));

const setColor = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("@/lib/native/decor-background", () => ({
  DecorBackground: { setColor },
}));

import { NativeEdgeToEdge } from "./native-edge-to-edge";

const CREAM = "#fbf6e9";
const NIGHT = "#161a12";

// Reset in beforeEach: the previous test's component is unmounted by RTL cleanup
// (its MutationObserver disconnected) before this runs, so removing the class
// here can't fire a stray observer into this test.
beforeEach(() => {
  getPlatform.mockReturnValue("android");
  document.documentElement.classList.remove("dark");
  vi.clearAllMocks();
});

describe("NativeEdgeToEdge", () => {
  it("paints the decor background cream in light mode on Android", async () => {
    render(<NativeEdgeToEdge />);
    await waitFor(() =>
      expect(setColor).toHaveBeenCalledWith({ color: CREAM }),
    );
  });

  it("paints it the night colour when the app is in dark mode", async () => {
    document.documentElement.classList.add("dark");
    render(<NativeEdgeToEdge />);
    await waitFor(() => expect(setColor).toHaveBeenCalledWith({ color: NIGHT }));
  });

  it("repaints when the theme toggles", async () => {
    render(<NativeEdgeToEdge />);
    await waitFor(() =>
      expect(setColor).toHaveBeenCalledWith({ color: CREAM }),
    );
    setColor.mockClear();

    document.documentElement.classList.add("dark");
    await waitFor(() => expect(setColor).toHaveBeenCalledWith({ color: NIGHT }));
  });

  it("does nothing on iOS or the web", () => {
    getPlatform.mockReturnValue("ios");
    render(<NativeEdgeToEdge />);
    expect(setColor).not.toHaveBeenCalled();
  });
});

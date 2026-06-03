import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const isNativePlatform = vi.hoisted(() => vi.fn(() => true));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const hide = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@capacitor/splash-screen", () => ({ SplashScreen: { hide } }));

import { SplashHider } from "./splash-hider";

afterEach(() => vi.clearAllMocks());

describe("SplashHider", () => {
  it("hides the splash once the app has mounted on native", async () => {
    isNativePlatform.mockReturnValue(true);
    render(<SplashHider />);
    await waitFor(() => expect(hide).toHaveBeenCalled());
  });

  it("does nothing on the web (there is no native splash)", async () => {
    isNativePlatform.mockReturnValue(false);
    render(<SplashHider />);
    await new Promise((r) => setTimeout(r, 10));
    expect(hide).not.toHaveBeenCalled();
  });
});

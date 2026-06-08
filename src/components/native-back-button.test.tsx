import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const isNativePlatform = vi.hoisted(() => vi.fn(() => true));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const addListener = vi.hoisted(() => vi.fn());
const exitApp = vi.hoisted(() => vi.fn());
vi.mock("@capacitor/app", () => ({ App: { addListener, exitApp } }));

import { NativeBackButton } from "./native-back-button";

type BackHandler = (event: { canGoBack?: boolean }) => void;

beforeEach(() => {
  isNativePlatform.mockReturnValue(true);
  addListener.mockResolvedValue({ remove: vi.fn() });
});
afterEach(() => vi.clearAllMocks());

describe("NativeBackButton", () => {
  it("navigates back through history on the Android back button", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<NativeBackButton />);

    await waitFor(() =>
      expect(addListener).toHaveBeenCalledWith(
        "backButton",
        expect.any(Function),
      ),
    );
    const handler = addListener.mock.calls[0][1] as BackHandler;

    handler({ canGoBack: true });
    expect(back).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it("exits the app when there is nowhere to go back to", async () => {
    render(<NativeBackButton />);
    await waitFor(() => expect(addListener).toHaveBeenCalled());
    const handler = addListener.mock.calls[0][1] as BackHandler;

    handler({ canGoBack: false });
    expect(exitApp).toHaveBeenCalledTimes(1);
  });

  it("does nothing on the web", () => {
    isNativePlatform.mockReturnValue(false);
    render(<NativeBackButton />);
    expect(addListener).not.toHaveBeenCalled();
  });
});

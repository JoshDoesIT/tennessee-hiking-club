import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const isNativePlatform = vi.hoisted(() => vi.fn(() => true));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

import { OfflinePrecache } from "./offline-precache";

const postMessage = vi.fn();

function stubServiceWorker(value: unknown) {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value,
  });
}

afterEach(() => {
  stubServiceWorker(undefined);
  vi.clearAllMocks();
});

describe("OfflinePrecache", () => {
  it("asks the active worker to precache every route on a native build", async () => {
    isNativePlatform.mockReturnValue(true);
    stubServiceWorker({ ready: Promise.resolve({ active: { postMessage } }) });

    render(<OfflinePrecache routes={["/", "/trails/a"]} />);

    await waitFor(() => expect(postMessage).toHaveBeenCalled());
    expect(postMessage).toHaveBeenCalledWith({
      type: "TNHC_PRECACHE",
      routes: ["/", "/trails/a"],
    });
  });

  it("does nothing on the web (lazy caching stays the default there)", async () => {
    isNativePlatform.mockReturnValue(false);
    stubServiceWorker({ ready: Promise.resolve({ active: { postMessage } }) });

    render(<OfflinePrecache routes={["/"]} />);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(postMessage).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const isNativePlatform = vi.hoisted(() => vi.fn(() => true));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

import { OfflinePrecache } from "./offline-precache";

const fetchMock = vi.fn(
  async (..._args: unknown[]) =>
    ({ ok: true, text: async () => "" }) as unknown as Response,
);

function stubServiceWorker(value: unknown) {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value,
  });
}

beforeEach(() => vi.stubGlobal("fetch", fetchMock));
afterEach(() => {
  stubServiceWorker(undefined);
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("OfflinePrecache", () => {
  it("warms every route as a document so the worker caches it (native)", async () => {
    isNativePlatform.mockReturnValue(true);
    stubServiceWorker({ ready: Promise.resolve({}) });

    render(<OfflinePrecache routes={["/", "/trails/a"]} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledWith("/", {
      headers: { Accept: "text/html" },
    });
    expect(fetchMock).toHaveBeenCalledWith("/trails/a", {
      headers: { Accept: "text/html" },
    });
  });

  it("also warms each page's images so photos load offline (#244)", async () => {
    isNativePlatform.mockReturnValue(true);
    stubServiceWorker({ ready: Promise.resolve({}) });
    const html = `<img src="/_next/image?url=%2Fp.jpg&amp;w=750&amp;q=75" />`;
    fetchMock.mockImplementation(
      async (input: unknown) =>
        ({
          ok: true,
          text: async () =>
            String(input).startsWith("/_next/image") ? "" : html,
        }) as unknown as Response,
    );

    render(<OfflinePrecache routes={["/trails/a"]} />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/_next/image?url=%2Fp.jpg&w=750&q=75",
      ),
    );
  });

  it("does nothing on the web (lazy caching stays the default there)", async () => {
    isNativePlatform.mockReturnValue(false);
    stubServiceWorker({ ready: Promise.resolve({}) });

    render(<OfflinePrecache routes={["/"]} />);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

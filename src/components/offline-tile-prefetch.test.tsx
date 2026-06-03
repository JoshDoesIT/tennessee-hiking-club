import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const isNativePlatform = vi.hoisted(() => vi.fn(() => true));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const prefetchAllTrailAreas = vi.hoisted(() =>
  vi.fn(async () => ({ ok: 1, failed: 0, trails: 1 })),
);
vi.mock("@/lib/maps/prefetch", () => ({ prefetchAllTrailAreas }));

import { OfflineTilePrefetch } from "./offline-tile-prefetch";

const trailheads = [
  { lat: 35.96, lng: -83.92 },
  { lat: 36.12, lng: -84.21 },
];

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

describe("OfflineTilePrefetch", () => {
  it("prefetches every trailhead's map area on a native build", async () => {
    isNativePlatform.mockReturnValue(true);
    stubServiceWorker({ ready: Promise.resolve({}) });

    render(<OfflineTilePrefetch trailheads={trailheads} />);

    await waitFor(() => expect(prefetchAllTrailAreas).toHaveBeenCalled());
    expect(
      (prefetchAllTrailAreas.mock.calls[0] as unknown as [unknown])[0],
    ).toEqual(trailheads);
  });

  it("does nothing on the web", async () => {
    isNativePlatform.mockReturnValue(false);
    stubServiceWorker({ ready: Promise.resolve({}) });

    render(<OfflineTilePrefetch trailheads={trailheads} />);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(prefetchAllTrailAreas).not.toHaveBeenCalled();
  });
});

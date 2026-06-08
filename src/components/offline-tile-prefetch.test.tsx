import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const isNativePlatform = vi.hoisted(() => vi.fn(() => true));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const prefetchAllTrailAreas = vi.hoisted(() =>
  vi.fn(async () => ({ ok: 1, failed: 0, trails: 1 })),
);
vi.mock("@/lib/maps/prefetch", () => ({ prefetchAllTrailAreas }));

const offlineTilesActive = vi.hoisted(() => vi.fn(() => false));
vi.mock("@/lib/maps/offline-tiles", () => ({ offlineTilesActive }));

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

const firstCall = () =>
  prefetchAllTrailAreas.mock.calls[0] as unknown as [
    unknown,
    { warm?: unknown },
  ];

afterEach(() => {
  stubServiceWorker(undefined);
  vi.clearAllMocks();
  isNativePlatform.mockReturnValue(true);
  offlineTilesActive.mockReturnValue(false);
});

describe("OfflineTilePrefetch", () => {
  it("prefetches via the service worker on the networked native build", async () => {
    isNativePlatform.mockReturnValue(true);
    offlineTilesActive.mockReturnValue(false);
    stubServiceWorker({ ready: Promise.resolve({}) });

    render(<OfflineTilePrefetch trailheads={trailheads} />);

    await waitFor(() => expect(prefetchAllTrailAreas).toHaveBeenCalled());
    const [centers, opts] = firstCall();
    expect(centers).toEqual(trailheads);
    // No warm: the worker does the caching here.
    expect(opts.warm).toBeUndefined();
  });

  it("warms the native store on the local bundle, with no service worker", async () => {
    isNativePlatform.mockReturnValue(true);
    offlineTilesActive.mockReturnValue(true);
    // Deliberately no service worker stubbed: the local-bundle path must not
    // depend on one.

    render(<OfflineTilePrefetch trailheads={trailheads} />);

    await waitFor(() => expect(prefetchAllTrailAreas).toHaveBeenCalled());
    const [centers, opts] = firstCall();
    expect(centers).toEqual(trailheads);
    expect(typeof opts.warm).toBe("function");
  });

  it("does nothing on the web", async () => {
    isNativePlatform.mockReturnValue(false);
    stubServiceWorker({ ready: Promise.resolve({}) });

    render(<OfflineTilePrefetch trailheads={trailheads} />);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(prefetchAllTrailAreas).not.toHaveBeenCalled();
  });
});

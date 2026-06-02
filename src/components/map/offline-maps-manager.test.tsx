import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/maps/tile-cache", () => ({
  clearOfflineTiles: vi.fn(async () => ({ cleared: true })),
  deleteOfflineTiles: vi.fn(async () => ({ deleted: 0 })),
}));
vi.mock("@/lib/maps/tile-sources", () => ({
  resolveTileSources: vi.fn(async () => [
    { template: "https://t/planet/v/{z}/{x}/{y}.pbf", maxzoom: 14 },
  ]),
}));

import { OfflineMapsManager } from "./offline-maps-manager";
import {
  saveRegion,
  clearRegions,
  type OfflineRegion,
} from "@/lib/maps/offline-regions";
import * as tileCache from "@/lib/maps/tile-cache";

const region = (over: Partial<OfflineRegion> = {}): OfflineRegion => ({
  id: "r1",
  name: "Obed",
  bounds: { west: -84.05, south: 35.9, east: -83.85, north: 36.05 },
  minZoom: 10,
  maxZoom: 14,
  tileCount: 320,
  savedAt: "2026-06-01T12:00:00.000Z",
  ...over,
});

beforeEach(() => {
  window.localStorage.clear();
  clearRegions();
  vi.clearAllMocks();
});

describe("OfflineMapsManager", () => {
  it("invites the member to download an area when none are saved", () => {
    render(<OfflineMapsManager />);
    expect(screen.getByText(/no areas downloaded/i)).toBeInTheDocument();
  });

  it("lists each saved region with its tile count", () => {
    saveRegion(region({ id: "a", name: "Obed", tileCount: 320 }));
    saveRegion(region({ id: "b", name: "Frozen Head", tileCount: 144 }));
    render(<OfflineMapsManager />);
    expect(screen.getByText("Obed")).toBeInTheDocument();
    expect(screen.getByText("Frozen Head")).toBeInTheDocument();
    expect(screen.getByText(/320 tiles/)).toBeInTheDocument();
  });

  it("removes one region and asks the worker to delete its tiles", async () => {
    const user = userEvent.setup();
    saveRegion(region({ id: "a", name: "Obed" }));
    saveRegion(region({ id: "b", name: "Frozen Head" }));
    render(<OfflineMapsManager />);

    await user.click(screen.getByRole("button", { name: /remove obed/i }));

    expect(screen.queryByText("Obed")).not.toBeInTheDocument();
    expect(screen.getByText("Frozen Head")).toBeInTheDocument();
    expect(tileCache.deleteOfflineTiles).toHaveBeenCalled();
  });

  it("clears all downloaded tiles after confirming", async () => {
    const user = userEvent.setup();
    saveRegion(region({ id: "a", name: "Obed" }));
    render(<OfflineMapsManager />);

    await user.click(screen.getByRole("button", { name: /clear all/i }));
    // Inline confirm, so destructive action takes a second, deliberate click.
    await user.click(screen.getByRole("button", { name: /^confirm/i }));

    expect(screen.getByText(/no areas downloaded/i)).toBeInTheDocument();
    expect(tileCache.clearOfflineTiles).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/maps/tile-sources", () => ({
  resolveTileSources: vi.fn(async () => [
    { template: "https://t/planet/v/{z}/{x}/{y}.pbf", maxzoom: 14 },
  ]),
}));
vi.mock("@/lib/maps/download-region", async (orig) => {
  const actual = await orig();
  return {
    ...(actual as object),
    downloadTiles: vi.fn(async (urls: string[]) => ({
      ok: urls.length,
      failed: 0,
      total: urls.length,
    })),
  };
});

import { DownloadAreaControl } from "./download-area-control";
import { readRegions, clearRegions } from "@/lib/maps/offline-regions";

const BOX = { west: -84.02, south: 35.92, east: -83.96, north: 35.98 };

beforeEach(() => {
  window.localStorage.clear();
  clearRegions();
  vi.clearAllMocks();
});

describe("DownloadAreaControl", () => {
  it("estimates the area, downloads it, and saves it offline", async () => {
    const user = userEvent.setup();
    render(
      <DownloadAreaControl getViewport={() => ({ bounds: BOX, zoom: 12 })} />,
    );

    await user.click(
      screen.getByRole("button", { name: /download this area/i }),
    );

    // The estimate (resolved asynchronously) and the confirm controls appear.
    expect(await screen.findByText(/tiles/i)).toBeInTheDocument();
    const start = await screen.findByRole("button", {
      name: /start download/i,
    });
    await user.click(start);

    expect(
      await screen.findByText(/available offline|saved/i),
    ).toBeInTheDocument();
    expect(readRegions()).toHaveLength(1);
    expect(readRegions()[0].tileCount).toBeGreaterThan(0);
  });

  it("asks the member to move the map when there is no viewport", async () => {
    const user = userEvent.setup();
    render(<DownloadAreaControl getViewport={() => null} />);

    await user.click(
      screen.getByRole("button", { name: /download this area/i }),
    );

    expect(await screen.findByText(/move the map/i)).toBeInTheDocument();
    expect(readRegions()).toHaveLength(0);
  });
});

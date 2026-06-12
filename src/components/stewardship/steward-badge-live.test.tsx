import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StewardBadgeLive } from "./steward-badge-live";

function mockCount(count: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({ count }) }) as unknown as Response),
  );
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("StewardBadgeLive", () => {
  it("shows the steward badge once a contribution count loads", async () => {
    mockCount(3);
    render(<StewardBadgeLive />);
    await waitFor(() =>
      expect(screen.getByText("Trail Steward")).toBeInTheDocument(),
    );
  });

  it("shows nothing with no contributions and no pledge", async () => {
    mockCount(0);
    render(<StewardBadgeLive />);
    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByText("Trail Steward")).toBeNull();
  });
});

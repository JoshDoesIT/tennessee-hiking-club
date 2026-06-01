import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouteReviewList } from "./route-review-list";

const contribution = {
  id: "r1",
  trailSlug: "grotto-falls",
  trailName: "Grotto Falls",
  name: "Saturday morning",
  pointCount: 540,
  lengthMiles: 2.6,
  gainFt: 620,
  submittedBy: "Trail Ann",
  submittedOn: "2026-05-29",
  entry: {
    yaml: "route:\n  - lat: 35.6826\n    lng: -83.4702\n    elevationFt: 3125",
  },
};

function setupFetch() {
  const calls: Array<{
    url: string;
    body: { action?: string; type?: string } | null;
  }> = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return {
      ok: true,
      json: async () => ({ ok: true, prUrl: null }),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { calls };
}

afterEach(() => vi.unstubAllGlobals());

describe("RouteReviewList", () => {
  it("lists pending route contributions with the submitter and stats", () => {
    setupFetch();
    render(<RouteReviewList contributions={[contribution]} />);
    expect(screen.getByText("Grotto Falls")).toBeInTheDocument();
    expect(screen.getByText(/Trail Ann/)).toBeInTheDocument();
    expect(screen.getByText(/Saturday morning/)).toBeInTheDocument();
    expect(screen.getByText(/2\.6/)).toBeInTheDocument();
    expect(screen.getByText(/620/)).toBeInTheDocument();
  });

  it("approves a contribution via the review route with the route type", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<RouteReviewList contributions={[contribution]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.url.includes("/api/contributions/r1/review") &&
            c.body?.action === "approve" &&
            c.body?.type === "route",
        ),
      ).toBe(true),
    );
  });

  it("reveals the route YAML to paste after approval", async () => {
    const user = userEvent.setup();
    setupFetch();
    render(<RouteReviewList contributions={[contribution]} />);
    expect(screen.queryByText(/elevationFt: 3125/)).toBeNull();
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(await screen.findByText(/elevationFt: 3125/)).toBeInTheDocument();
  });

  it("shows an empty state when there is nothing to review", () => {
    setupFetch();
    render(<RouteReviewList contributions={[]} />);
    expect(screen.getByText(/no recorded routes/i)).toBeInTheDocument();
  });
});

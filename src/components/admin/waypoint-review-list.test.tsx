import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaypointReviewList } from "./waypoint-review-list";

const suggestion = {
  id: "w1",
  trailSlug: "virgin-falls",
  trailName: "Virgin Falls",
  name: "Big Branch Falls",
  type: "waterfall",
  description: "110-ft drop",
  lat: 35.83,
  lng: -85.29,
  hasPhoto: true,
  submittedBy: "Trail Ann",
  submittedOn: "2026-05-29",
  entry: {
    yaml: '  - lat: 35.83\n    lng: -85.29\n    name: "Big Branch Falls"\n    type: waterfall',
    valid: true,
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
    return { ok: true, json: async () => ({ ok: true, prUrl: null }) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { calls };
}

afterEach(() => vi.unstubAllGlobals());

describe("WaypointReviewList", () => {
  it("lists pending suggestions with the submitter and an optional photo", () => {
    setupFetch();
    render(<WaypointReviewList suggestions={[suggestion]} />);
    expect(screen.getByText("Virgin Falls")).toBeInTheDocument();
    expect(screen.getByText(/Big Branch Falls/)).toBeInTheDocument();
    expect(screen.getByText(/Trail Ann/)).toBeInTheDocument();
    const img = screen.getByRole("img", { name: /suggested for/i });
    expect(img).toHaveAttribute(
      "src",
      "/api/contributions/waypoint/w1/photo/view",
    );
  });

  it("omits the photo when the suggestion has none", () => {
    setupFetch();
    render(
      <WaypointReviewList suggestions={[{ ...suggestion, hasPhoto: false }]} />,
    );
    expect(screen.queryByRole("img", { name: /suggested for/i })).toBeNull();
  });

  it("approves a suggestion via the review route with the waypoint type", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<WaypointReviewList suggestions={[suggestion]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.url.includes("/api/contributions/w1/review") &&
            c.body?.action === "approve" &&
            c.body?.type === "waypoint",
        ),
      ).toBe(true),
    );
  });

  it("reveals the YAML entry to paste after approval", async () => {
    const user = userEvent.setup();
    setupFetch();
    render(<WaypointReviewList suggestions={[suggestion]} />);
    expect(screen.queryByText(/name: "Big Branch Falls"/)).toBeNull();
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(
      await screen.findByText(/name: "Big Branch Falls"/),
    ).toBeInTheDocument();
  });
});

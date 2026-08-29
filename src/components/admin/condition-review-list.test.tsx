import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConditionReviewList } from "./condition-review-list";

const report = {
  id: "c1",
  trailSlug: "virgin-falls",
  trailName: "Virgin Falls",
  status: "Muddy near the base",
  note: "Bring poles.",
  reportDate: "2026-05-29",
  submittedBy: "Trail Ann",
  submittedOn: "2026-05-29",
  entry: {
    yaml: '  - date: "2026-05-29"\n    status: "Muddy near the base"',
    valid: true,
  },
};

function setupFetch({ prUrl = null }: { prUrl?: string | null } = {}) {
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
      json: async () => ({ ok: true, prUrl }),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { calls };
}

afterEach(() => vi.unstubAllGlobals());

describe("ConditionReviewList", () => {
  it("lists pending condition reports", () => {
    setupFetch();
    render(<ConditionReviewList reports={[report]} />);
    expect(screen.getByText("Virgin Falls")).toBeInTheDocument();
    expect(screen.getByText(/Muddy near the base/)).toBeInTheDocument();
    expect(screen.getByText(/Trail Ann/)).toBeInTheDocument();
  });

  it("approves a report via the review route with the condition type", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<ConditionReviewList reports={[report]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.url.includes("/api/contributions/c1/review") &&
            c.body?.action === "approve" &&
            c.body?.type === "condition",
        ),
      ).toBe(true),
    );
  });

  it("reveals the YAML entry to paste after approval", async () => {
    const user = userEvent.setup();
    setupFetch();
    render(<ConditionReviewList reports={[report]} />);
    expect(screen.queryByText(/status: "Muddy near the base"/)).toBeNull();
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(
      await screen.findByText(/status: "Muddy near the base"/),
    ).toBeInTheDocument();
  });

  it("links the opened PR when approval auto-publishes", async () => {
    const user = userEvent.setup();
    setupFetch({ prUrl: "https://github.com/o/r/pull/13" });
    render(<ConditionReviewList reports={[report]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    const link = await screen.findByRole("link", { name: /pull request/i });
    expect(link).toHaveAttribute("href", "https://github.com/o/r/pull/13");
  });

  it("rejects a report", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<ConditionReviewList reports={[report]} />);
    await user.click(screen.getByRole("button", { name: /reject/i }));
    await waitFor(() =>
      expect(calls.some((c) => c.body?.action === "reject")).toBe(true),
    );
  });

  it("shows an empty state when there is nothing to review", () => {
    setupFetch();
    render(<ConditionReviewList reports={[]} />);
    expect(screen.getByText(/no condition reports/i)).toBeInTheDocument();
  });
});

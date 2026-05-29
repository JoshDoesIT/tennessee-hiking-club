import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmissionReviewList } from "./submission-review-list";

const sub = {
  id: "sub1",
  name: "Piney Falls",
  region: "East",
  area: "Piney Falls SNA",
  lat: 35.7277,
  lng: -84.8556,
  description: "Short loop to a waterfall.",
  submittedBy: "Trail Ann",
  submittedOn: "2026-05-20",
};

function setupFetch() {
  const calls: Array<{ url: string; body: { action?: string } | null }> = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return {
      ok: true,
      json: async () => ({ ok: true, status: "approved" }),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { calls };
}

afterEach(() => vi.unstubAllGlobals());

describe("SubmissionReviewList", () => {
  it("lists pending submissions", () => {
    setupFetch();
    render(<SubmissionReviewList submissions={[sub]} />);
    expect(screen.getByText("Piney Falls")).toBeInTheDocument();
    expect(screen.getByText(/Piney Falls SNA/)).toBeInTheDocument();
    expect(screen.getByText(/Trail Ann/)).toBeInTheDocument();
  });

  it("approves a submission via the review route", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<SubmissionReviewList submissions={[sub]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.url.includes("/api/contributions/sub1/review") &&
            c.body?.action === "approve",
        ),
      ).toBe(true),
    );
  });

  it("rejects a submission via the review route", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<SubmissionReviewList submissions={[sub]} />);
    await user.click(screen.getByRole("button", { name: /reject/i }));
    await waitFor(() =>
      expect(calls.some((c) => c.body?.action === "reject")).toBe(true),
    );
  });

  it("shows an empty state when there is nothing to review", () => {
    setupFetch();
    render(<SubmissionReviewList submissions={[]} />);
    expect(screen.getByText(/nothing to review/i)).toBeInTheDocument();
  });
});

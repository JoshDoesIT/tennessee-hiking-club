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
  generated: {
    fileName: "piney-falls.md",
    markdown: "---\nslug: piney-falls\nname: Piney Falls\n---\n\nShort loop.",
    valid: true,
    missing: [],
  },
};

function setupFetch({ prUrl = null }: { prUrl?: string | null } = {}) {
  const calls: Array<{ url: string; body: { action?: string } | null }> = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return {
      ok: true,
      json: async () => ({ ok: true, status: "approved", prUrl }),
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

  it("reveals the generated content file after approval", async () => {
    const user = userEvent.setup();
    setupFetch();
    render(<SubmissionReviewList submissions={[sub]} />);
    // Not shown before a decision.
    expect(screen.queryByText(/piney-falls\.md/)).toBeNull();

    await user.click(screen.getByRole("button", { name: /approve/i }));

    expect(await screen.findByText(/piney-falls\.md/)).toBeInTheDocument();
    expect(screen.getByText(/slug: piney-falls/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download/i }),
    ).toBeInTheDocument();
  });

  it("links the opened PR when approval auto-publishes", async () => {
    const user = userEvent.setup();
    setupFetch({ prUrl: "https://github.com/o/r/pull/12" });
    render(<SubmissionReviewList submissions={[sub]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    const link = await screen.findByRole("link", { name: /pull request/i });
    expect(link).toHaveAttribute("href", "https://github.com/o/r/pull/12");
  });

  it("flags missing required fields on an incomplete generated file", async () => {
    const user = userEvent.setup();
    setupFetch();
    const incomplete = {
      ...sub,
      generated: {
        ...sub.generated,
        valid: false,
        missing: ["difficulty", "routeType"],
      },
    };
    render(<SubmissionReviewList submissions={[incomplete]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));

    expect(await screen.findByText(/difficulty/i)).toBeInTheDocument();
    expect(screen.getByText(/routeType/i)).toBeInTheDocument();
  });
});

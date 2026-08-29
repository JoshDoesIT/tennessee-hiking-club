import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoReviewList } from "./photo-review-list";

const photo = {
  id: "p1",
  trailSlug: "virgin-falls",
  trailName: "Virgin Falls",
  alt: "The falls in spring flow",
  credit: "Photo by Trail Ann",
  submittedBy: "Trail Ann",
  submittedOn: "2026-05-29",
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

describe("PhotoReviewList", () => {
  it("lists pending photos with a preview image", () => {
    setupFetch();
    render(<PhotoReviewList photos={[photo]} />);
    expect(screen.getByText("Virgin Falls")).toBeInTheDocument();
    expect(screen.getByText(/2026-05-29/)).toBeInTheDocument();
    const img = screen.getByRole("img", { name: /falls in spring flow/i });
    expect(img).toHaveAttribute("src", "/api/contributions/photo/p1/view");
  });

  it("approves a photo via the review route with the photo type", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<PhotoReviewList photos={[photo]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.url.includes("/api/contributions/p1/review") &&
            c.body?.action === "approve" &&
            c.body?.type === "photo",
        ),
      ).toBe(true),
    );
  });

  it("offers the image to download after approval without auto-publish", async () => {
    const user = userEvent.setup();
    setupFetch();
    render(<PhotoReviewList photos={[photo]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    const link = await screen.findByRole("link", { name: /download/i });
    expect(link).toHaveAttribute("href", "/api/contributions/photo/p1/view");
  });

  it("links the opened PR when approval auto-publishes", async () => {
    const user = userEvent.setup();
    setupFetch({ prUrl: "https://github.com/o/r/pull/20" });
    render(<PhotoReviewList photos={[photo]} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    const link = await screen.findByRole("link", { name: /pull request/i });
    expect(link).toHaveAttribute("href", "https://github.com/o/r/pull/20");
  });

  it("rejects a photo", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch();
    render(<PhotoReviewList photos={[photo]} />);
    await user.click(screen.getByRole("button", { name: /reject/i }));
    await waitFor(() =>
      expect(calls.some((c) => c.body?.action === "reject")).toBe(true),
    );
  });

  it("shows an empty state when there is nothing to review", () => {
    setupFetch();
    render(<PhotoReviewList photos={[]} />);
    expect(screen.getByText(/no photos/i)).toBeInTheDocument();
  });
});

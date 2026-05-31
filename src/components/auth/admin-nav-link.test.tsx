import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminNavLink } from "./admin-nav-link";

function mockStatus(body: { isAdmin?: boolean } | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        (body === null
          ? { ok: false, json: async () => ({}) }
          : { ok: true, json: async () => body }) as unknown as Response,
    ),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminNavLink", () => {
  it("renders nothing for non-admins", async () => {
    mockStatus({ isAdmin: false });
    const { container } = render(<AdminNavLink />);
    await new Promise((r) => setTimeout(r));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the review-queue link for an admin", async () => {
    mockStatus({ isAdmin: true });
    render(<AdminNavLink />);
    const link = await screen.findByRole("link", { name: /review queue/i });
    expect(link).toHaveAttribute("href", "/admin/submissions");
  });
});

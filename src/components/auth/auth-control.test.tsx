import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthControl } from "./auth-control";

// Auth.js /api/auth/session returns {} when signed out, { user, expires } in.
function mockSession(user: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => (user ? { user, expires: "2099-01-01" } : {}),
        }) as unknown as Response,
    ),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("AuthControl", () => {
  it("links to the sign-in page when signed out", async () => {
    mockSession(null);
    render(<AuthControl />);
    const link = await screen.findByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/signin");
  });

  it("shows the user and a sign-out control when signed in", async () => {
    mockSession({ name: "Josh" });
    render(<AuthControl />);
    expect(await screen.findByText(/josh/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });
});

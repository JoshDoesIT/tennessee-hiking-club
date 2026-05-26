import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthControl } from "./auth-control";

function mockMe(user: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        ({ ok: true, json: async () => ({ user }) }) as unknown as Response,
    ),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("AuthControl", () => {
  it("shows a sign-in link when signed out", async () => {
    mockMe(null);
    render(<AuthControl />);
    const link = await screen.findByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/api/auth/authorize");
  });

  it("shows the user and a sign-out control when signed in", async () => {
    mockMe({ sub: "u1", name: "Josh" });
    render(<AuthControl />);
    expect(await screen.findByText(/josh/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });
});

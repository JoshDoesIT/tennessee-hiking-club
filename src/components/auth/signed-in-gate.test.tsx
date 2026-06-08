import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SignedInGate } from "./signed-in-gate";

// Auth.js /api/auth/session returns {} signed out, { user, expires } signed in.
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

describe("SignedInGate", () => {
  it("renders its children once a session is present", async () => {
    mockSession({ id: "u1" });
    render(
      <SignedInGate>
        <span>members only</span>
      </SignedInGate>,
    );
    await waitFor(() =>
      expect(screen.getByText("members only")).toBeInTheDocument(),
    );
  });

  it("renders nothing for a signed-out visitor", async () => {
    mockSession(null);
    render(
      <SignedInGate>
        <span>members only</span>
      </SignedInGate>,
    );
    // Let the session effect settle, then confirm nothing rendered.
    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByText("members only")).toBeNull();
  });
});

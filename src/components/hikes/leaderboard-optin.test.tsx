import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaderboardOptIn } from "./leaderboard-optin";

function setupFetch(session: unknown, profileBody: unknown) {
  let postBody: unknown = null;
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/api/profile")) {
      if (init?.method === "POST") {
        postBody = init.body ? JSON.parse(String(init.body)) : null;
        return {
          ok: true,
          json: async () => ({ ok: true }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => profileBody,
      } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getPostBody: () => postBody };
}

afterEach(() => vi.unstubAllGlobals());

describe("LeaderboardOptIn", () => {
  it("renders nothing and does not call /api/profile when signed out", async () => {
    const { f } = setupFetch({}, { isPublic: false, displayName: "" });
    render(<LeaderboardOptIn />);
    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.queryByRole("checkbox")).toBeNull();
    // The bug: /api/profile would return 401 and the browser would log it.
    // Gating on the session check avoids the noisy console error entirely.
    expect(
      f.mock.calls.some((c) => String(c[0]).includes("/api/profile")),
    ).toBe(false);
  });

  it("shows the opt-in toggle when signed in and saves changes", async () => {
    const user = userEvent.setup();
    const { getPostBody } = setupFetch(
      { user: { id: "u1" } },
      { isPublic: false, displayName: "" },
    );
    render(<LeaderboardOptIn />);

    const toggle = await screen.findByRole("checkbox", {
      name: /leaderboard/i,
    });
    await user.click(toggle);
    await user.type(screen.getByLabelText(/display name/i), "Trail Ann");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(getPostBody()).toMatchObject({
        isPublic: true,
        displayName: "Trail Ann",
      }),
    );
  });
});

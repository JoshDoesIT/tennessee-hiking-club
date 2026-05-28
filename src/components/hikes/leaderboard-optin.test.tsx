import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaderboardOptIn } from "./leaderboard-optin";

function setupFetch(getStatus: number, getBody: unknown) {
  let postBody: unknown = null;
  const f = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      postBody = init.body ? JSON.parse(String(init.body)) : null;
      return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
    }
    return {
      ok: getStatus < 400,
      status: getStatus,
      json: async () => getBody,
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getPostBody: () => postBody };
}

afterEach(() => vi.unstubAllGlobals());

describe("LeaderboardOptIn", () => {
  it("renders nothing when not signed in", async () => {
    const { f } = setupFetch(401, { error: "Not signed in" });
    render(<LeaderboardOptIn />);
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("shows the opt-in toggle when signed in and saves changes", async () => {
    const user = userEvent.setup();
    const { getPostBody } = setupFetch(200, { isPublic: false, displayName: "" });
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

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FriendsAndSharing } from "./friends-and-sharing";

vi.mock("./leaderboard-optin", () => ({
  LeaderboardOptIn: () => <div>leaderboard-optin</div>,
}));
vi.mock("./friends-manager", () => ({
  FriendsManager: () => <div>friends-manager</div>,
}));
vi.mock("./share-my-tennessee", () => ({
  ShareMyTennessee: () => <div>share-my-tennessee</div>,
}));

function mockSession(session: unknown) {
  const f = vi.fn(async (url: string) => {
    if (String(url).includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return f;
}

afterEach(() => vi.unstubAllGlobals());

describe("FriendsAndSharing", () => {
  it("groups the social features under one heading when signed in", async () => {
    mockSession({ user: { id: "u1" } });
    render(<FriendsAndSharing origin="https://example.com" />);

    expect(
      await screen.findByRole("heading", { name: /friends & sharing/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("leaderboard-optin")).toBeInTheDocument();
    expect(screen.getByText("friends-manager")).toBeInTheDocument();
    expect(screen.getByText("share-my-tennessee")).toBeInTheDocument();
  });

  it("shows only sharing and no group heading when signed out", async () => {
    const f = mockSession({});
    render(<FriendsAndSharing origin="https://example.com" />);

    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.getByText("share-my-tennessee")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /friends & sharing/i }),
    ).toBeNull();
    expect(screen.queryByText("leaderboard-optin")).toBeNull();
    expect(screen.queryByText("friends-manager")).toBeNull();
  });
});

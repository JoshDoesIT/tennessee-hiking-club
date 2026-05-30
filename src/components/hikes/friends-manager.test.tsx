import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FriendsManager } from "./friends-manager";

const data = {
  code: "CODE1234",
  friends: [{ friendshipId: "f1", userId: "a", displayName: "Ann" }],
  incoming: [{ id: "f2", userId: "b", displayName: "Bob" }],
  outgoing: [],
};

function setupFetch(session: unknown) {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url: path, method, body });
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/respond") || /\/api\/friends\/[^/]+$/.test(path)) {
      return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
    }
    if (path.endsWith("/api/friends")) {
      if (method === "POST") {
        return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
      }
      return { ok: true, json: async () => data } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { calls };
}

afterEach(() => vi.unstubAllGlobals());

describe("FriendsManager", () => {
  it("renders nothing and never loads friends when signed out", async () => {
    const { calls } = setupFetch({});
    render(<FriendsManager />);
    await waitFor(() =>
      expect(calls.some((c) => c.url.includes("/api/auth/session"))).toBe(true),
    );
    expect(screen.queryByText(/CODE1234/)).toBeNull();
    expect(calls.some((c) => c.url.endsWith("/api/friends"))).toBe(false);
  });

  it("shows your friend code, friends, and requests when signed in", async () => {
    setupFetch({ user: { id: "me" } });
    render(<FriendsManager />);
    expect(await screen.findByText(/CODE1234/)).toBeInTheDocument();
    expect(screen.getByText("Ann")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("sends a friend request by code", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch({ user: { id: "me" } });
    render(<FriendsManager />);
    await screen.findByText(/CODE1234/);

    await user.type(screen.getByLabelText(/add a friend/i), "anncode1");
    await user.click(screen.getByRole("button", { name: /add friend/i }));

    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.url.endsWith("/api/friends") &&
            c.method === "POST" &&
            (c.body as { code?: string })?.code === "anncode1",
        ),
      ).toBe(true),
    );
  });

  it("accepts an incoming request", async () => {
    const user = userEvent.setup();
    const { calls } = setupFetch({ user: { id: "me" } });
    render(<FriendsManager />);
    await screen.findByText("Bob");

    await user.click(screen.getByRole("button", { name: /accept/i }));
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.url.includes("/api/friends/f2/respond") &&
            (c.body as { action?: string })?.action === "accept",
        ),
      ).toBe(true),
    );
  });
});

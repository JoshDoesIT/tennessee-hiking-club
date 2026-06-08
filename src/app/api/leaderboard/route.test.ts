import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth }));

const loadPublicEntries = vi.hoisted(() => vi.fn());
const loadFriendEntries = vi.hoisted(() => vi.fn());
vi.mock("@/lib/hikes/leaderboard-server", () => ({
  loadPublicEntries,
  loadFriendEntries,
}));

import { GET } from "./route";

const req = (qs: string) =>
  new Request(`http://localhost/api/leaderboard${qs}`);

beforeEach(() => vi.clearAllMocks());

describe("GET /api/leaderboard", () => {
  it("returns the public board by default, for the given window", async () => {
    loadPublicEntries.mockResolvedValue([{ user: "Ana" }]);
    const res = await GET(req("?window=year"));
    expect(await res.json()).toEqual({ entries: [{ user: "Ana" }] });
    expect(loadPublicEntries).toHaveBeenCalledWith("year");
  });

  it("prompts sign-in for the friends board when signed out", async () => {
    auth.mockResolvedValue(null);
    const res = await GET(req("?scope=friends"));
    expect(await res.json()).toEqual({ entries: [], needsSignIn: true });
    expect(loadFriendEntries).not.toHaveBeenCalled();
  });

  it("loads the friends board for a signed-in member", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    loadFriendEntries.mockResolvedValue([{ user: "Me" }]);
    const res = await GET(req("?scope=friends&window=all"));
    expect(await res.json()).toEqual({ entries: [{ user: "Me" }] });
    expect(loadFriendEntries).toHaveBeenCalledWith("u1", "all");
  });
});

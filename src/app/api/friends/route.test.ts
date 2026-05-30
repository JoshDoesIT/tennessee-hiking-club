// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getFriendsData: vi.fn(),
  sendFriendRequest: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/friends/friends-server", () => ({
  getFriendsData: mocks.getFriendsData,
  sendFriendRequest: mocks.sendFriendRequest,
}));

import { GET, POST } from "./route";

const postReq = (body: unknown) =>
  new Request("http://localhost/api/friends", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
});

describe("GET /api/friends", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("returns the user's friends data", async () => {
    mocks.getFriendsData.mockResolvedValue({
      code: "CODE1234",
      friends: [],
      incoming: [],
      outgoing: [],
    });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ code: "CODE1234" });
    expect(mocks.getFriendsData).toHaveBeenCalledWith("u1");
  });
});

describe("POST /api/friends", () => {
  it("returns 401 when signed out and never sends", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(postReq({ code: "ANNCODE1" }));
    expect(res.status).toBe(401);
    expect(mocks.sendFriendRequest).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing code", async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
    expect(mocks.sendFriendRequest).not.toHaveBeenCalled();
  });

  it("sends a request and returns the outcome", async () => {
    mocks.sendFriendRequest.mockResolvedValue({ ok: true });
    const res = await POST(postReq({ code: "ANNCODE1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.sendFriendRequest).toHaveBeenCalledWith("u1", "ANNCODE1");
  });

  it("passes through a rejection reason", async () => {
    mocks.sendFriendRequest.mockResolvedValue({ ok: false, reason: "self" });
    const res = await POST(postReq({ code: "MYCODE12" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: false, reason: "self" });
  });
});

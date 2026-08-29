// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  removeFriendship: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/friends/friends-server", () => ({
  removeFriendship: mocks.removeFriendship,
}));

import { DELETE } from "./route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = () =>
  new Request("http://localhost/api/friends/f1", { method: "DELETE" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.removeFriendship.mockResolvedValue({ ok: true });
});

describe("DELETE /api/friends/[id]", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await DELETE(req(), ctx("f1"))).status).toBe(401);
    expect(mocks.removeFriendship).not.toHaveBeenCalled();
  });

  it("removes a friendship", async () => {
    const res = await DELETE(req(), ctx("f1"));
    expect(res.status).toBe(200);
    expect(mocks.removeFriendship).toHaveBeenCalledWith("u1", "f1");
  });

  it("returns 400 when not allowed", async () => {
    mocks.removeFriendship.mockResolvedValue({
      ok: false,
      reason: "not-allowed",
    });
    expect((await DELETE(req(), ctx("f1"))).status).toBe(400);
  });
});

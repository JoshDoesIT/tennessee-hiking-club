// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  respondToRequest: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/friends/friends-server", () => ({
  respondToRequest: mocks.respondToRequest,
}));

import { POST } from "./route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (action: unknown) =>
  new Request("http://localhost/api/friends/f1/respond", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.respondToRequest.mockResolvedValue({ ok: true });
});

describe("POST /api/friends/[id]/respond", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await POST(req("accept"), ctx("f1"))).status).toBe(401);
    expect(mocks.respondToRequest).not.toHaveBeenCalled();
  });

  it("rejects an unknown action", async () => {
    const res = await POST(req("maybe"), ctx("f1"));
    expect(res.status).toBe(400);
    expect(mocks.respondToRequest).not.toHaveBeenCalled();
  });

  it("accepts a request", async () => {
    const res = await POST(req("accept"), ctx("f1"));
    expect(res.status).toBe(200);
    expect(mocks.respondToRequest).toHaveBeenCalledWith("u1", "f1", "accept");
  });

  it("returns 400 when the action is not allowed", async () => {
    mocks.respondToRequest.mockResolvedValue({ ok: false, reason: "not-allowed" });
    const res = await POST(req("accept"), ctx("f1"));
    expect(res.status).toBe(400);
  });
});

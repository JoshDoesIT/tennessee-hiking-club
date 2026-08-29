// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => {
  const onConflictDoUpdate = vi.fn(async () => undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));
  const where = vi.fn(async () => undefined);
  const del = vi.fn(() => ({ where }));
  const auth = vi.fn();
  return { auth, insert, values, onConflictDoUpdate, del, where };
});
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: mocks.insert, delete: mocks.del }),
}));

import { POST, DELETE } from "./route";

const req = (method: string, body: unknown) =>
  new Request("http://localhost/api/push/register", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  process.env.DATABASE_URL = "postgres://test";
});

describe("POST /api/push/register", () => {
  it("upserts the device, associating the signed-in user", async () => {
    const res = await POST(req("POST", { token: "tok-1", platform: "ios" }));
    expect(res.status).toBe(200);
    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row).toMatchObject({
      token: "tok-1",
      platform: "ios",
      userId: "u1",
    });
    expect(mocks.onConflictDoUpdate).toHaveBeenCalled();
  });

  it("stores an anonymous subscription when signed out (userId null)", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(
      req("POST", { token: "tok-2", platform: "android" }),
    );
    expect(res.status).toBe(200);
    expect((mocks.values as Mock).mock.calls[0][0].userId).toBeNull();
  });

  it("rejects an invalid platform without touching the database", async () => {
    const res = await POST(req("POST", { token: "tok", platform: "watch" }));
    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    const res = await POST(req("POST", { platform: "ios" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/push/register", () => {
  it("removes the subscription for the token (opt-out)", async () => {
    const res = await DELETE(req("DELETE", { token: "tok-1" }));
    expect(res.status).toBe(200);
    expect(mocks.del).toHaveBeenCalled();
    expect(mocks.where).toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    const res = await DELETE(req("DELETE", {}));
    expect(res.status).toBe(400);
    expect(mocks.del).not.toHaveBeenCalled();
  });
});

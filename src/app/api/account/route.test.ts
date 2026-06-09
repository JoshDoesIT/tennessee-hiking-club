import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));

const deleteAccount = vi.hoisted(() => vi.fn());
vi.mock("@/lib/account/delete-account", () => ({ deleteAccount }));

import { DELETE } from "./route";

beforeEach(() => vi.clearAllMocks());

describe("DELETE /api/account", () => {
  it("rejects a signed-out caller without deleting anything", async () => {
    auth.mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes the signed-in member's account", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deleteAccount).toHaveBeenCalledWith(expect.anything(), "u1");
  });
});

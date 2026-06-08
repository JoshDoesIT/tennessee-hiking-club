import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth }));

const isAdminUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/admin-server", () => ({ isAdminUser }));

vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/push/transport", () => ({ defaultPushSender: () => vi.fn() }));

const notifyTrailAlert = vi.hoisted(() =>
  vi.fn(async () => ({ recipients: 3, sent: 2, failed: 1 })),
);
vi.mock("@/lib/push/send", () => ({ notifyTrailAlert }));

import { POST } from "./route";

beforeEach(() => vi.clearAllMocks());

describe("POST /api/admin/push-test", () => {
  it("forbids a signed-out or non-admin caller", async () => {
    auth.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(403);
    expect(notifyTrailAlert).not.toHaveBeenCalled();
  });

  it("forbids a signed-in non-admin", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    isAdminUser.mockResolvedValue(false);
    const res = await POST();
    expect(res.status).toBe(403);
    expect(notifyTrailAlert).not.toHaveBeenCalled();
  });

  it("sends a test push and returns the delivery counts for an admin", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    isAdminUser.mockResolvedValue(true);
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recipients: 3, sent: 2, failed: 1 });
    expect(notifyTrailAlert).toHaveBeenCalledTimes(1);
  });
});

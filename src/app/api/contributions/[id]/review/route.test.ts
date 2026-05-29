// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isAdminUser: vi.fn(),
  update: vi.fn(),
  set: vi.fn(() => ({ where: async () => undefined })),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/admin-server", () => ({ isAdminUser: mocks.isAdminUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    update: (table: unknown) => {
      mocks.update(table);
      return { set: mocks.set };
    },
  }),
}));

import { POST } from "./route";
import { trailSubmissions, conditionSubmissions } from "@/lib/db/schema";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function reviewReq(action: unknown, type?: string) {
  return new Request("http://localhost/api/contributions/sub1/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(type ? { action, type } : { action }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "admin1" } });
  mocks.isAdminUser.mockResolvedValue(true);
});

describe("POST /api/contributions/[id]/review", () => {
  it("returns 401 when not signed in", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(reviewReq("approve"), ctx("sub1"));
    expect(res.status).toBe(401);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin and never updates", async () => {
    mocks.isAdminUser.mockResolvedValue(false);
    const res = await POST(reviewReq("approve"), ctx("sub1"));
    expect(res.status).toBe(403);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("approves a submission, setting status and reviewedAt", async () => {
    const res = await POST(reviewReq("approve"), ctx("sub1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: "approved" });
    const patch = (mocks.set as Mock).mock.calls[0][0];
    expect(patch.status).toBe("approved");
    expect(patch.reviewedAt).toBeInstanceOf(Date);
  });

  it("rejects a submission", async () => {
    const res = await POST(reviewReq("reject"), ctx("sub1"));
    expect(res.status).toBe(200);
    expect((mocks.set as Mock).mock.calls[0][0].status).toBe("rejected");
  });

  it("returns 400 for an unknown action and never updates", async () => {
    const res = await POST(reviewReq("delete"), ctx("sub1"));
    expect(res.status).toBe(400);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("reviews a trail submission against the trail table by default", async () => {
    await POST(reviewReq("approve"), ctx("sub1"));
    expect(mocks.update).toHaveBeenCalledWith(trailSubmissions);
  });

  it("reviews a condition submission against the condition table", async () => {
    const res = await POST(reviewReq("approve", "condition"), ctx("c1"));
    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(conditionSubmissions);
    const patch = (mocks.set as Mock).mock.calls[0][0];
    expect(patch.reviewStatus).toBe("approved");
    expect(patch.reviewedAt).toBeInstanceOf(Date);
  });

  it("returns 400 for an unknown submission type", async () => {
    const res = await POST(reviewReq("approve", "photo"), ctx("sub1"));
    expect(res.status).toBe(400);
    expect(mocks.set).not.toHaveBeenCalled();
  });
});

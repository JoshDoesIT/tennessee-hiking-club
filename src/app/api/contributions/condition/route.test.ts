// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getTrailBySlug: vi.fn(),
  values: vi.fn(() => ({ returning: async () => [{ id: "c1" }] })),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/trails", () => ({ getTrailBySlug: mocks.getTrailBySlug }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: () => ({ values: mocks.values }) }),
}));

import { POST } from "./route";

function postReq(body: unknown) {
  return new Request("http://localhost/api/contributions/condition", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = { trailSlug: "virgin-falls", status: "Muddy", note: "Slick." };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.getTrailBySlug.mockReturnValue({ slug: "virgin-falls" });
  process.env.DATABASE_URL = "postgres://test";
});

describe("POST /api/contributions/condition", () => {
  it("returns 401 when not signed in and never inserts", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(postReq(valid));
    expect(res.status).toBe(401);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid report and never inserts", async () => {
    const res = await POST(
      postReq({ trailSlug: "virgin-falls", status: "  " }),
    );
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown trail and never inserts", async () => {
    mocks.getTrailBySlug.mockReturnValue(null);
    const res = await POST(postReq(valid));
    expect(res.status).toBe(404);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("inserts a pending report against the signed-in user", async () => {
    const res = await POST(postReq(valid));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "c1" });
    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row).toMatchObject({
      userId: "u1",
      trailSlug: "virgin-falls",
      status: "Muddy",
    });
    expect(typeof row.reportDate).toBe("string");
  });
});

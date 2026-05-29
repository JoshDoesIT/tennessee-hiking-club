// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  values: vi.fn(() => ({ returning: async () => [{ id: "sub1" }] })),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: () => ({ values: mocks.values }) }),
}));

import { POST } from "./route";

const valid = {
  name: "Piney Falls",
  region: "East",
  area: "Piney Falls State Natural Area",
  lat: 35.7277,
  lng: -84.8556,
  description: "A short loop to a walk-behind waterfall.",
};

function postReq(body: unknown) {
  return new Request("http://localhost/api/contributions/trail", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  process.env.DATABASE_URL = "postgres://test";
});

describe("POST /api/contributions/trail", () => {
  it("returns 401 when not signed in and never inserts", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(postReq(valid));
    expect(res.status).toBe(401);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid submission and never inserts", async () => {
    const res = await POST(postReq({ ...valid, lat: 33.7, lng: -84.4 }));
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("inserts a pending submission against the signed-in user", async () => {
    const res = await POST(postReq(valid));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "sub1" });
    expect(mocks.values).toHaveBeenCalledTimes(1);
    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row).toMatchObject({
      userId: "u1",
      name: "Piney Falls",
      region: "East",
      lat: 35.7277,
    });
    expect(row.status ?? "pending").toBe("pending");
  });

  it("returns 400 for a non-JSON body", async () => {
    const req = new Request("http://localhost/api/contributions/trail", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });
});

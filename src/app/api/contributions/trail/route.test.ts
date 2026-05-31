// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  values: vi.fn(() => ({ returning: async () => [{ id: "sub1" }] })),
  put: vi.fn(async () => ({
    url: "https://store.blob/contributions/trail-photos/u1/x.jpg",
  })),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@vercel/blob", () => ({ put: mocks.put }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: () => ({ values: mocks.values }) }),
}));

import { POST } from "./route";

const valid: Record<string, string> = {
  name: "Piney Falls",
  region: "East",
  area: "Piney Falls State Natural Area",
  lat: "35.7277",
  lng: "-84.8556",
  description: "A short loop to a walk-behind waterfall.",
};

function postReq(fields: Record<string, string>, files: File[] = []) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  for (const f of files) form.append("photos", f);
  return new Request("http://localhost/api/contributions/trail", {
    method: "POST",
    body: form,
  });
}

function img(type = "image/jpeg", bytes = 1000) {
  return new File([new Uint8Array(bytes)], "p.jpg", { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  process.env.DATABASE_URL = "postgres://test";
  process.env.BLOB_READ_WRITE_TOKEN = "blob-token";
});

describe("POST /api/contributions/trail", () => {
  it("returns 401 when not signed in and never inserts", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(postReq(valid));
    expect(res.status).toBe(401);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 400 for an out-of-state submission and never inserts", async () => {
    const res = await POST(postReq({ ...valid, lat: "33.7", lng: "-84.4" }));
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("inserts a pending submission with no photos", async () => {
    const res = await POST(postReq(valid));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "sub1" });
    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row).toMatchObject({
      userId: "u1",
      name: "Piney Falls",
      photoUrls: null,
    });
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("uploads attached photos and stores their urls on the submission", async () => {
    const res = await POST(postReq(valid, [img(), img()]));
    expect(res.status).toBe(201);
    expect(mocks.put).toHaveBeenCalledTimes(2);
    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row.photoUrls).toHaveLength(2);
    expect(String(row.photoUrls[0])).toContain("https://store.blob/");
  });

  it("rejects a non-image attachment without inserting", async () => {
    const res = await POST(
      postReq(valid, [new File(["x"], "a.txt", { type: "text/plain" })]),
    );
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });
});

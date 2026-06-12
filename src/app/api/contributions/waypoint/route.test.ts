// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  put: vi.fn(async () => ({
    url: "https://store.private.blob.vercel-storage.com/contributions/waypoints/u1/x.jpg",
  })),
  auth: vi.fn(),
  getTrailBySlug: vi.fn(),
  values: vi.fn(() => ({ returning: async () => [{ id: "w1" }] })),
}));
vi.mock("@vercel/blob", () => ({ put: mocks.put }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/trails", () => ({ getTrailBySlug: mocks.getTrailBySlug }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: () => ({ values: mocks.values }) }),
}));

import { POST } from "./route";

function wpReq(
  fields: Record<string, string> = {
    trailSlug: "virgin-falls",
    lat: "35.83",
    lng: "-85.29",
    name: "Big Branch Falls",
    type: "waterfall",
    description: "110-ft drop",
  },
  file?: Blob | null,
) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  if (file) form.set("photo", file, "photo.jpg");
  return new Request("http://localhost/api/contributions/waypoint", {
    method: "POST",
    body: form,
  });
}

const jpeg = () => new Blob(["jpeg-bytes"], { type: "image/jpeg" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.getTrailBySlug.mockReturnValue({ slug: "virgin-falls" });
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_dummy";
  process.env.DATABASE_URL = "postgres://test";
});

describe("POST /api/contributions/waypoint", () => {
  it("returns 401 when not signed in and never inserts", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(wpReq());
    expect(res.status).toBe(401);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown type and never inserts", async () => {
    const res = await POST(
      wpReq({
        trailSlug: "virgin-falls",
        lat: "35.83",
        lng: "-85.29",
        name: "X",
        type: "dragon",
      }),
    );
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 400 for coordinates outside Tennessee", async () => {
    const res = await POST(
      wpReq({
        trailSlug: "virgin-falls",
        lat: "40",
        lng: "-100",
        name: "X",
        type: "summit",
      }),
    );
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown trail", async () => {
    mocks.getTrailBySlug.mockReturnValue(null);
    const res = await POST(wpReq());
    expect(res.status).toBe(404);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("records a pending suggestion with no photo", async () => {
    const res = await POST(wpReq());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "w1" });
    expect(mocks.put).not.toHaveBeenCalled();
    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row).toMatchObject({
      userId: "u1",
      trailSlug: "virgin-falls",
      lat: 35.83,
      lng: -85.29,
      name: "Big Branch Falls",
      type: "waterfall",
      description: "110-ft drop",
      photoUrl: null,
    });
  });

  it("uploads an optional photo privately and records its url", async () => {
    const res = await POST(wpReq(undefined, jpeg()));
    expect(res.status).toBe(201);
    const [path, , opts] = (mocks.put as Mock).mock.calls[0];
    expect(path).toMatch(/^contributions\/waypoints\/u1\//);
    expect(opts).toMatchObject({
      access: "private",
      contentType: "image/jpeg",
    });
    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row.photoUrl).toBe(
      "https://store.private.blob.vercel-storage.com/contributions/waypoints/u1/x.jpg",
    );
  });

  it("returns 400 for a non-image photo and never inserts", async () => {
    const res = await POST(
      wpReq(undefined, new Blob(["x"], { type: "text/plain" })),
    );
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 503 when a photo is attached but blob storage is unconfigured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await POST(wpReq(undefined, jpeg()));
    expect(res.status).toBe(503);
    expect(mocks.put).not.toHaveBeenCalled();
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  put: vi.fn(async () => ({
    url: "https://store.private.blob.vercel-storage.com/contributions/photos/u1/x.jpg",
  })),
  auth: vi.fn(),
  getTrailBySlug: vi.fn(),
  values: vi.fn(() => ({ returning: async () => [{ id: "p1" }] })),
}));
vi.mock("@vercel/blob", () => ({ put: mocks.put }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/trails", () => ({ getTrailBySlug: mocks.getTrailBySlug }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: () => ({ values: mocks.values }) }),
}));

import { POST } from "./route";

function photoReq(
  file: Blob | null,
  fields: Record<string, string> = {
    trailSlug: "virgin-falls",
    alt: "The falls in spring flow",
    credit: "Photo by Trail Ann",
  },
) {
  const form = new FormData();
  if (file) form.set("file", file, "photo.jpg");
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return new Request("http://localhost/api/contributions/photo", {
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

describe("POST /api/contributions/photo", () => {
  it("returns 401 when not signed in and never uploads", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(photoReq(jpeg()));
    expect(res.status).toBe(401);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("returns 400 when alt text is missing", async () => {
    const res = await POST(photoReq(jpeg(), { trailSlug: "virgin-falls", alt: "  " }));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-image file", async () => {
    const res = await POST(photoReq(new Blob(["x"], { type: "text/plain" })));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown trail", async () => {
    mocks.getTrailBySlug.mockReturnValue(null);
    const res = await POST(photoReq(jpeg()));
    expect(res.status).toBe(404);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("returns 503 when blob storage is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await POST(photoReq(jpeg()));
    expect(res.status).toBe(503);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("uploads privately and inserts a pending submission", async () => {
    const res = await POST(photoReq(jpeg()));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "p1" });

    const [path, , opts] = (mocks.put as Mock).mock.calls[0];
    expect(path).toMatch(/^contributions\/photos\/u1\//);
    expect(opts).toMatchObject({ access: "private", contentType: "image/jpeg" });

    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row).toMatchObject({
      userId: "u1",
      trailSlug: "virgin-falls",
      alt: "The falls in spring flow",
      credit: "Photo by Trail Ann",
      blobUrl:
        "https://store.private.blob.vercel-storage.com/contributions/photos/u1/x.jpg",
    });
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Vercel Blob, auth, and the db are mocked so no live calls happen in tests.
const mocks = vi.hoisted(() => ({
  put: vi.fn(async () => ({
    url: "https://store.private.blob.vercel-storage.com/hikes/u1/x.jpg",
  })),
  del: vi.fn(async () => undefined),
  get: vi.fn(async () => ({
    statusCode: 200,
    stream: new ReadableStream(),
    blob: { contentType: "image/jpeg" },
  })),
  auth: vi.fn(),
}));
vi.mock("@vercel/blob", () => ({
  put: mocks.put,
  del: mocks.del,
  get: mocks.get,
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}));

import { POST, DELETE, GET } from "./route";

const BLOB_HOST = "https://store.private.blob.vercel-storage.com";
function viewReq(u?: string) {
  const qs = u === undefined ? "" : `?u=${encodeURIComponent(u)}`;
  return new Request(`http://localhost/api/hikes/photo${qs}`, {
    method: "GET",
  });
}
function deleteReq(url: unknown) {
  return new Request("http://localhost/api/hikes/photo", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

function photoReq(file: Blob | null) {
  const form = new FormData();
  if (file) form.set("file", file, "photo.jpg");
  return new Request("http://localhost/api/hikes/photo", {
    method: "POST",
    body: form,
  });
}

const jpeg = () => new Blob(["jpeg-bytes"], { type: "image/jpeg" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_dummy";
});

describe("POST /api/hikes/photo", () => {
  it("returns 401 when not signed in and never uploads", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(photoReq(jpeg()));
    expect(res.status).toBe(401);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("uploads to a user-namespaced path and returns the url", async () => {
    const res = await POST(photoReq(jpeg()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://store.private.blob.vercel-storage.com/hikes/u1/x.jpg",
    });
    expect(mocks.put).toHaveBeenCalledTimes(1);
    const [path, , opts] = (mocks.put as Mock).mock.calls[0];
    expect(path).toMatch(/^hikes\/u1\//);
    expect(opts).toMatchObject({
      access: "private",
      contentType: "image/jpeg",
    });
  });

  it("returns a null url (200) and does not upload when the token is absent", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await POST(photoReq(jpeg()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: null });
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("returns 400 when no file is provided", async () => {
    const res = await POST(photoReq(null));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-image file", async () => {
    const res = await POST(photoReq(new Blob(["x"], { type: "text/plain" })));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("returns 400 for an oversized image", async () => {
    const big = new Blob([new Uint8Array(5 * 1024 * 1024)], {
      type: "image/jpeg",
    });
    const res = await POST(photoReq(big));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/hikes/photo", () => {
  it("returns 401 when not signed in and never deletes", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await DELETE(deleteReq(`${BLOB_HOST}/hikes/u1/x.jpg`));
    expect(res.status).toBe(401);
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("deletes a blob in the user's own namespace", async () => {
    const url = `${BLOB_HOST}/hikes/u1/x.jpg`;
    const res = await DELETE(deleteReq(url));
    expect(res.status).toBe(200);
    expect(mocks.del).toHaveBeenCalledWith(url);
  });

  it("refuses to delete a blob outside the user's namespace", async () => {
    const res = await DELETE(
      deleteReq(`${BLOB_HOST}/hikes/someone-else/x.jpg`),
    );
    expect(res.status).toBe(403);
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing or non-string url", async () => {
    const res = await DELETE(deleteReq(undefined));
    expect(res.status).toBe(400);
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("no-ops (200) without deleting when the token is absent", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await DELETE(deleteReq(`${BLOB_HOST}/hikes/u1/x.jpg`));
    expect(res.status).toBe(200);
    expect(mocks.del).not.toHaveBeenCalled();
  });
});

describe("GET /api/hikes/photo (private view proxy)", () => {
  it("returns 401 when not signed in", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await GET(viewReq(`${BLOB_HOST}/hikes/u1/x.jpg`));
    expect(res.status).toBe(401);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("streams a private blob in the user's namespace with its content type", async () => {
    const res = await GET(viewReq(`${BLOB_HOST}/hikes/u1/x.jpg`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(mocks.get).toHaveBeenCalledWith("hikes/u1/x.jpg", {
      access: "private",
    });
  });

  it("refuses a blob outside the user's namespace", async () => {
    const res = await GET(viewReq(`${BLOB_HOST}/hikes/other/x.jpg`));
    expect(res.status).toBe(403);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("returns 400 when the url is missing", async () => {
    const res = await GET(viewReq(undefined));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the token is absent", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await GET(viewReq(`${BLOB_HOST}/hikes/u1/x.jpg`));
    expect(res.status).toBe(404);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});

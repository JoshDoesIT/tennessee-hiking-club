// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isAdminUser: vi.fn(),
  get: vi.fn(async () => ({
    statusCode: 200,
    stream: new ReadableStream(),
    blob: { contentType: "image/jpeg" },
  })),
  rows: [] as Array<{ blobUrl: string }>,
}));
vi.mock("@vercel/blob", () => ({ get: mocks.get }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/admin-server", () => ({ isAdminUser: mocks.isAdminUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => mocks.rows }) }),
    }),
  }),
}));

import { GET } from "./route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = () =>
  new Request("http://localhost/api/contributions/photo/p1/view");
const BLOB = "https://store.private.blob.vercel-storage.com";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "admin1" } });
  mocks.isAdminUser.mockResolvedValue(true);
  mocks.rows = [{ blobUrl: `${BLOB}/contributions/photos/u1/x.jpg` }];
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_dummy";
});

describe("GET /api/contributions/photo/[id]/view", () => {
  it("returns 401 when not signed in", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await GET(req(), ctx("p1"));
    expect(res.status).toBe(401);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    mocks.isAdminUser.mockResolvedValue(false);
    const res = await GET(req(), ctx("p1"));
    expect(res.status).toBe(403);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("returns 404 when the submission is not found", async () => {
    mocks.rows = [];
    const res = await GET(req(), ctx("p1"));
    expect(res.status).toBe(404);
  });

  it("streams the private image for an admin", async () => {
    const res = await GET(req(), ctx("p1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(mocks.get).toHaveBeenCalledWith("contributions/photos/u1/x.jpg", {
      access: "private",
    });
  });
});

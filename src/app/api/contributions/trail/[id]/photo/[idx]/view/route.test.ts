// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isAdmin: vi.fn(),
  rows: [] as Array<{ photoUrls: string[] | null }>,
  get: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/admin-server", () => ({ isAdminUser: mocks.isAdmin }));
vi.mock("@vercel/blob", () => ({ get: mocks.get }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => mocks.rows }) }),
    }),
  }),
}));

import { GET } from "./route";

function ctx(id = "s1", idx = "0") {
  return { params: Promise.resolve({ id, idx }) };
}
const req = () => new Request("http://localhost/x");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.isAdmin.mockResolvedValue(true);
  mocks.rows = [
    { photoUrls: ["https://store.blob/contributions/trail-photos/u1/x.jpg"] },
  ];
  mocks.get.mockResolvedValue({
    statusCode: 200,
    stream: new ReadableStream(),
    blob: { contentType: "image/jpeg" },
  });
  process.env.BLOB_READ_WRITE_TOKEN = "t";
});

describe("GET trail-submission photo view", () => {
  it("401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET(req(), ctx())).status).toBe(401);
  });

  it("403 for a non-admin", async () => {
    mocks.isAdmin.mockResolvedValue(false);
    expect((await GET(req(), ctx())).status).toBe(403);
  });

  it("404 when the photo index is out of range", async () => {
    expect((await GET(req(), ctx("s1", "9"))).status).toBe(404);
  });

  it("streams the private image for an admin", async () => {
    const res = await GET(req(), ctx());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
  });
});

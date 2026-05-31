// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: async () => [{}, {}] }) }),
  }),
}));

import { GET } from "./route";

describe("GET /api/passkeys", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the passkey count when signed in", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 2 });
  });
});

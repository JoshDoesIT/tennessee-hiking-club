// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), isAdmin: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/admin-server", () => ({ isAdminUser: mocks.isAdmin }));

import { GET } from "./route";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/status", () => {
  it("is false (and never checks) when signed out", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await (await GET()).json()).toEqual({ isAdmin: false });
    expect(mocks.isAdmin).not.toHaveBeenCalled();
  });

  it("reflects isAdminUser for the signed-in user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.isAdmin.mockResolvedValue(true);
    expect(await (await GET()).json()).toEqual({ isAdmin: true });
    expect(mocks.isAdmin).toHaveBeenCalledWith("u1");
  });

  it("is false for a signed-in non-admin", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u2" } });
    mocks.isAdmin.mockResolvedValue(false);
    expect(await (await GET()).json()).toEqual({ isAdmin: false });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth }));

const getContributionCountForUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stewardship/contributions-server", () => ({
  getContributionCountForUser,
}));

import { GET } from "./route";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/contributions/count", () => {
  it("returns 0 for a signed-out visitor without touching the DB", async () => {
    auth.mockResolvedValue(null);
    const res = await GET();
    expect(await res.json()).toEqual({ count: 0 });
    expect(getContributionCountForUser).not.toHaveBeenCalled();
  });

  it("returns the signed-in member's recognized contribution count", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    getContributionCountForUser.mockResolvedValue(4);
    const res = await GET();
    expect(await res.json()).toEqual({ count: 4 });
    expect(getContributionCountForUser).toHaveBeenCalledWith("u1");
  });
});

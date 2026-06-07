import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
const mintAuthCode = vi.fn();
vi.mock("@/lib/auth/native-auth", () => ({
  mintAuthCode: (...a: unknown[]) => mintAuthCode(...a),
}));

import { GET } from "./route";

beforeEach(() => {
  auth.mockReset();
  mintAuthCode.mockReset();
});

describe("GET /api/native-auth/complete", () => {
  it("mints a code and deep-links it back to the app when signed in", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    mintAuthCode.mockResolvedValue("code123");
    const res = await GET();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("tnhc://auth?code=code123");
    expect(mintAuthCode).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("deep-links an error when the browser session is not signed in", async () => {
    auth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("tnhc://auth?error=");
    expect(mintAuthCode).not.toHaveBeenCalled();
  });
});

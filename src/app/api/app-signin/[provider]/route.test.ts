import { describe, it, expect, vi, beforeEach } from "vitest";

const signIn = vi.fn();
vi.mock("@/auth", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));

import { GET } from "./route";

function call(provider: string) {
  return GET(new Request(`https://www.tnhiking.club/api/app-signin/${provider}`), {
    params: Promise.resolve({ provider }),
  });
}

describe("GET /api/app-signin/[provider]", () => {
  beforeEach(() => signIn.mockReset());

  it("starts the provider flow server-side and redirects to its URL", async () => {
    signIn.mockResolvedValue("https://github.com/login/oauth/authorize?x=1");
    const res = await call("github");
    expect(signIn).toHaveBeenCalledWith("github", {
      redirect: false,
      redirectTo: "/hikes",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://github.com/login/oauth/authorize?x=1",
    );
  });

  it("rejects an unknown provider without starting a flow", async () => {
    const res = await call("evilcorp");
    expect(signIn).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toContain("/signin");
  });
});

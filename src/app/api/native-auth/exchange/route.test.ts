import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
const consumeAuthCode = vi.fn();
const createSession = vi.fn();
vi.mock("@/lib/auth/native-auth", () => ({
  consumeAuthCode: (...a: unknown[]) => consumeAuthCode(...a),
  createSession: (...a: unknown[]) => createSession(...a),
  sessionCookie: (value: string) => ({
    name: "__Secure-authjs.session-token",
    value,
    options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
  }),
}));

import { POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("https://www.tnhiking.club/api/native-auth/exchange", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  consumeAuthCode.mockReset();
  createSession.mockReset();
});

describe("POST /api/native-auth/exchange", () => {
  it("exchanges a valid code for a session cookie", async () => {
    consumeAuthCode.mockResolvedValue("user-1");
    createSession.mockResolvedValue("sess-token");
    const res = await post({ code: "good" });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("__Secure-authjs.session-token=sess-token");
    expect(createSession).toHaveBeenCalledWith(expect.anything(), "user-1");
    // The token is also returned so the local bundle can store it and send it as
    // a bearer header (the cookie does not flow cross-origin there; phase 4).
    expect(await res.json()).toEqual({ ok: true, sessionToken: "sess-token" });
  });

  it("rejects an invalid or used code with 401 and no cookie", async () => {
    consumeAuthCode.mockResolvedValue(null);
    const res = await post({ code: "bad" });
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects a request with no code", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(consumeAuthCode).not.toHaveBeenCalled();
  });
});

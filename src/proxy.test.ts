import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const req = (opts: { method?: string; origin?: string; auth?: string }) =>
  new NextRequest("https://www.tnhiking.club/api/auth/session", {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.origin ? { origin: opts.origin } : {}),
      ...(opts.auth ? { authorization: opts.auth } : {}),
    },
  });

describe("proxy (native API access)", () => {
  it("answers CORS preflight for a Capacitor origin", () => {
    const res = proxy(req({ method: "OPTIONS", origin: "capacitor://localhost" }));
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "capacitor://localhost",
    );
    expect(
      res.headers.get("access-control-allow-headers")?.toLowerCase(),
    ).toContain("authorization");
  });

  it("adds CORS headers to a Capacitor-origin request", () => {
    const res = proxy(req({ origin: "capacitor://localhost", auth: "Bearer tok" }));
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "capacitor://localhost",
    );
  });

  it("leaves same-origin (web) requests untouched", () => {
    const res = proxy(req({ origin: "https://www.tnhiking.club" }));
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("does not add CORS for a preflight from an unknown origin", () => {
    const res = proxy(req({ method: "OPTIONS", origin: "https://evil.example" }));
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

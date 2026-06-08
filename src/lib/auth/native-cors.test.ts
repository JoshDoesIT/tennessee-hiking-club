import { describe, it, expect } from "vitest";
import {
  isAllowedOrigin,
  corsHeaders,
  bearerToken,
  withSessionCookie,
  sessionCookieName,
} from "./native-cors";

describe("isAllowedOrigin", () => {
  it("allows the Capacitor local origins only", () => {
    expect(isAllowedOrigin("capacitor://localhost")).toBe(true);
    expect(isAllowedOrigin("https://localhost")).toBe(true);
    // Not the production site (that path is same-origin, no CORS) or anything else.
    expect(isAllowedOrigin("https://www.tnhiking.club")).toBe(false);
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin(null)).toBe(false);
  });
});

describe("corsHeaders", () => {
  it("echoes the specific origin and allows the Authorization header", () => {
    const h = corsHeaders("capacitor://localhost");
    expect(h["access-control-allow-origin"]).toBe("capacitor://localhost");
    expect(h["access-control-allow-headers"].toLowerCase()).toContain(
      "authorization",
    );
    expect(h["vary"]).toBe("Origin");
  });
});

describe("bearerToken", () => {
  it("extracts a Bearer token, or null", () => {
    expect(bearerToken("Bearer abc123")).toBe("abc123");
    expect(bearerToken("bearer abc123")).toBeNull(); // case-sensitive scheme
    expect(bearerToken("abc123")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});

describe("withSessionCookie", () => {
  it("appends the session cookie to an existing Cookie header", () => {
    const out = withSessionCookie("foo=1", "tok", true);
    expect(out).toBe("foo=1; __Secure-authjs.session-token=tok");
  });
  it("starts a Cookie header when there is none", () => {
    expect(withSessionCookie(null, "tok", true)).toBe(
      "__Secure-authjs.session-token=tok",
    );
  });
  it("uses the non-secure cookie name off production", () => {
    expect(sessionCookieName(false)).toBe("authjs.session-token");
    expect(sessionCookieName(true)).toBe("__Secure-authjs.session-token");
  });
});

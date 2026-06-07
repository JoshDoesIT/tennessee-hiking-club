import { describe, it, expect, vi, afterEach } from "vitest";

// The config wires the Drizzle adapter when DATABASE_URL is set; stub the client
// and the adapter so no real connection or driver detection is attempted.
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@auth/drizzle-adapter", () => ({ DrizzleAdapter: () => ({}) }));

import { buildAuthConfig } from "./config";
import type { NextAuthConfig } from "next-auth";

const ENV_KEYS = [
  "DATABASE_URL",
  "AUTH_GITHUB_ID",
  "AUTH_GOOGLE_ID",
  "AUTH_FACEBOOK_ID",
] as const;
const ORIGINAL = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL[k] === undefined) delete process.env[k];
    else process.env[k] = ORIGINAL[k];
  }
  vi.unstubAllEnvs();
});

function providerIds(cfg: NextAuthConfig): string[] {
  return (cfg.providers ?? []).map((p) => {
    const instance = typeof p === "function" ? p({}) : p;
    return (instance as { id: string }).id;
  });
}

describe("buildAuthConfig", () => {
  it("enables WebAuthn and adds the passkey provider when a database is configured", () => {
    process.env.DATABASE_URL = "postgresql://u:p@ep-test.neon.tech/db";
    const cfg = buildAuthConfig();
    expect(cfg.experimental?.enableWebAuthn).toBe(true);
    expect(providerIds(cfg)).toContain("passkey");
  });

  it("links GitHub and Google accounts that share a verified email", () => {
    process.env.AUTH_GITHUB_ID = "gh";
    process.env.AUTH_GOOGLE_ID = "go";
    const cfg = buildAuthConfig();
    const provs = (cfg.providers ?? []).map((p) =>
      typeof p === "function" ? p({}) : p,
    ) as Array<{
      id: string;
      options?: { allowDangerousEmailAccountLinking?: boolean };
    }>;
    for (const id of ["github", "google"]) {
      expect(
        provs.find((p) => p.id === id)?.options
          ?.allowDangerousEmailAccountLinking,
      ).toBe(true);
    }
  });

  it("adds Facebook only when its credentials exist, without email linking", () => {
    delete process.env.AUTH_FACEBOOK_ID;
    expect(providerIds(buildAuthConfig())).not.toContain("facebook");

    process.env.AUTH_FACEBOOK_ID = "fb";
    const cfg = buildAuthConfig();
    expect(providerIds(cfg)).toContain("facebook");
    // Facebook does not guarantee a verified email, so it must not
    // auto-link to an account created with another provider.
    const fb = (cfg.providers ?? [])
      .map((p) => (typeof p === "function" ? p({}) : p))
      .find((p) => (p as { id: string }).id === "facebook") as
      | { options?: { allowDangerousEmailAccountLinking?: boolean } }
      | undefined;
    expect(fb?.options?.allowDangerousEmailAccountLinking).not.toBe(true);
  });

  it("omits WebAuthn when no database is configured (e.g. the CI build)", () => {
    delete process.env.DATABASE_URL;
    const cfg = buildAuthConfig();
    expect(cfg.experimental?.enableWebAuthn).not.toBe(true);
    expect(providerIds(cfg)).not.toContain("passkey");
  });

  it("keeps Auth.js default cookies (Lax, not a SameSite=None override)", () => {
    // SameSite=None made the iOS WebView's tracking prevention drop the PKCE
    // cookie (#264); the default Lax cookie survives, so we must not override it.
    vi.stubEnv("NODE_ENV", "production");
    expect(buildAuthConfig().cookies).toBeUndefined();
  });

  it("logs the root cause of an auth error first, ahead of its wrappers", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const root = Object.assign(new Error("decryption operation failed"), {
        name: "JWEDecryptionFailed",
      });
      const mid = Object.assign(new Error("state value could not be parsed"), {
        name: "InvalidCheck",
        cause: root,
      });
      const top = Object.assign(new Error("Read more at ..."), {
        name: "CallbackRouteError",
        cause: { err: mid },
      });
      buildAuthConfig().logger?.error?.(top);
      expect(spy).toHaveBeenCalled();
      const logged = spy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(logged).toContain("JWEDecryptionFailed");
      // The deepest cause must appear before the top-level wrapper so it
      // survives log truncation.
      expect(logged.indexOf("JWEDecryptionFailed")).toBeLessThan(
        logged.indexOf("CallbackRouteError"),
      );
    } finally {
      spy.mockRestore();
    }
  });
});

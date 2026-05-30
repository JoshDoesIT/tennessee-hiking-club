import { describe, it, expect, vi, afterEach } from "vitest";

// The config wires the Drizzle adapter when DATABASE_URL is set; stub the client
// and the adapter so no real connection or driver detection is attempted.
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@auth/drizzle-adapter", () => ({ DrizzleAdapter: () => ({}) }));

import { buildAuthConfig } from "./config";
import type { NextAuthConfig } from "next-auth";

const ENV_KEYS = ["DATABASE_URL", "AUTH_GITHUB_ID", "AUTH_GOOGLE_ID"] as const;
const ORIGINAL = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL[k] === undefined) delete process.env[k];
    else process.env[k] = ORIGINAL[k];
  }
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

  it("omits WebAuthn when no database is configured (e.g. the CI build)", () => {
    delete process.env.DATABASE_URL;
    const cfg = buildAuthConfig();
    expect(cfg.experimental?.enableWebAuthn).not.toBe(true);
    expect(providerIds(cfg)).not.toContain("passkey");
  });
});

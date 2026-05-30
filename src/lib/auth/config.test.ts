import { describe, it, expect, vi, afterEach } from "vitest";

// The config wires the Drizzle adapter when DATABASE_URL is set; stub the client
// and the adapter so no real connection or driver detection is attempted.
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@auth/drizzle-adapter", () => ({ DrizzleAdapter: () => ({}) }));

import { buildAuthConfig } from "./config";
import type { NextAuthConfig } from "next-auth";

const ORIGINAL = process.env.DATABASE_URL;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL;
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

  it("omits WebAuthn when no database is configured (e.g. the CI build)", () => {
    delete process.env.DATABASE_URL;
    const cfg = buildAuthConfig();
    expect(cfg.experimental?.enableWebAuthn).not.toBe(true);
    expect(providerIds(cfg)).not.toContain("passkey");
  });
});

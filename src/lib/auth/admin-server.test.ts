// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ rows: [] as Array<{ githubLogin: string | null }> }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => mocks.rows }),
      }),
    }),
  }),
}));

import { isAdminUser } from "./admin-server";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgres://test";
  process.env.ADMIN_GITHUB_LOGINS = "octocat";
  mocks.rows = [];
});

describe("isAdminUser", () => {
  it("is true when the user's captured login is on the allowlist", async () => {
    mocks.rows = [{ githubLogin: "Octocat" }];
    expect(await isAdminUser("u1")).toBe(true);
  });

  it("is false when the user's login is not on the allowlist", async () => {
    mocks.rows = [{ githubLogin: "randomhiker" }];
    expect(await isAdminUser("u1")).toBe(false);
  });

  it("is false when the user has no captured login", async () => {
    mocks.rows = [{ githubLogin: null }];
    expect(await isAdminUser("u1")).toBe(false);
  });

  it("is false when there is no database configured", async () => {
    delete process.env.DATABASE_URL;
    expect(await isAdminUser("u1")).toBe(false);
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as Array<{ userId: string }>,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: async () => mocks.rows }) }),
  }),
}));

import {
  getApprovedSubmissionCount,
  getApprovedSubmissionCounts,
} from "./submissions-server";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgres://test";
  mocks.rows = [];
});

describe("getApprovedSubmissionCount", () => {
  it("counts the user's approved submissions", async () => {
    mocks.rows = [{ userId: "u1" }, { userId: "u1" }];
    expect(await getApprovedSubmissionCount("u1")).toBe(2);
  });

  it("returns 0 when no database is configured", async () => {
    delete process.env.DATABASE_URL;
    expect(await getApprovedSubmissionCount("u1")).toBe(0);
  });
});

describe("getApprovedSubmissionCounts", () => {
  it("groups approved counts by userId", async () => {
    mocks.rows = [{ userId: "a" }, { userId: "a" }, { userId: "b" }];
    const counts = await getApprovedSubmissionCounts(["a", "b"]);
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBe(1);
  });

  it("returns an empty map for no users without hitting the database", async () => {
    const counts = await getApprovedSubmissionCounts([]);
    expect(counts.size).toBe(0);
  });
});

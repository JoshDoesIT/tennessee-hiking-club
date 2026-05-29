// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ rows: [] as Array<{ userId: string }> }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: async () => mocks.rows }) }),
  }),
}));

import {
  getApprovedConditionCount,
  getApprovedConditionCounts,
} from "./conditions-server";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgres://test";
  mocks.rows = [];
});

describe("getApprovedConditionCount", () => {
  it("counts the user's approved condition reports", async () => {
    mocks.rows = [{ userId: "u1" }, { userId: "u1" }, { userId: "u1" }];
    expect(await getApprovedConditionCount("u1")).toBe(3);
  });

  it("returns 0 when no database is configured", async () => {
    delete process.env.DATABASE_URL;
    expect(await getApprovedConditionCount("u1")).toBe(0);
  });
});

describe("getApprovedConditionCounts", () => {
  it("groups approved reports by userId", async () => {
    mocks.rows = [{ userId: "a" }, { userId: "b" }, { userId: "b" }];
    const counts = await getApprovedConditionCounts(["a", "b"]);
    expect(counts.get("a")).toBe(1);
    expect(counts.get("b")).toBe(2);
  });

  it("returns an empty map for no users without hitting the database", async () => {
    expect((await getApprovedConditionCounts([])).size).toBe(0);
  });
});

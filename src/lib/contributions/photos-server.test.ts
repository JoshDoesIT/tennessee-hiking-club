// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as Array<{ userId: string; reviewStatus: string }>,
}));
const approved = (userId: string) => ({ userId, reviewStatus: "approved" });
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: async () => mocks.rows }) }),
  }),
}));

import {
  getApprovedPhotoCount,
  getApprovedPhotoCounts,
} from "./photos-server";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgres://test";
  mocks.rows = [];
});

describe("getApprovedPhotoCount", () => {
  it("counts the user's approved photos", async () => {
    mocks.rows = [approved("u1"), approved("u1")];
    expect(await getApprovedPhotoCount("u1")).toBe(2);
  });

  it("does not count a published photo (#153)", async () => {
    mocks.rows = [approved("u1"), { userId: "u1", reviewStatus: "published" }];
    expect(await getApprovedPhotoCount("u1")).toBe(1);
  });

  it("returns 0 when no database is configured", async () => {
    delete process.env.DATABASE_URL;
    expect(await getApprovedPhotoCount("u1")).toBe(0);
  });
});

describe("getApprovedPhotoCounts", () => {
  it("groups approved photos by userId", async () => {
    mocks.rows = [approved("a"), approved("b"), approved("a")];
    const counts = await getApprovedPhotoCounts(["a", "b"]);
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBe(1);
  });

  it("returns an empty map for no users", async () => {
    expect((await getApprovedPhotoCounts([])).size).toBe(0);
  });
});

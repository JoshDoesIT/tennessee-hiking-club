import { describe, it, expect } from "vitest";
import {
  mergeCleanups,
  planCleanupSync,
  rowToCleanup,
  cleanupToInsert,
} from "./cleanups-sync";

describe("mergeCleanups", () => {
  it("de-duplicates by day and sorts by date", () => {
    const merged = mergeCleanups(
      [{ loggedOn: "2026-05-02" }, { loggedOn: "2026-05-01" }],
      [{ loggedOn: "2026-05-02" }, { loggedOn: "2026-04-30" }],
    );
    expect(merged.map((c) => c.loggedOn)).toEqual([
      "2026-04-30",
      "2026-05-01",
      "2026-05-02",
    ]);
  });
});

describe("planCleanupSync", () => {
  it("inserts only the local days the account is missing", () => {
    const { toInsert, merged } = planCleanupSync(
      [{ loggedOn: "2026-05-01" }, { loggedOn: "2026-05-02" }],
      [{ loggedOn: "2026-05-01" }],
    );
    expect(toInsert.map((c) => c.loggedOn)).toEqual(["2026-05-02"]);
    expect(merged.map((c) => c.loggedOn)).toEqual(["2026-05-01", "2026-05-02"]);
  });

  it("is a no-op when the account already has every local day", () => {
    const { toInsert } = planCleanupSync(
      [{ loggedOn: "2026-05-01" }, { loggedOn: "2026-05-01" }],
      [{ loggedOn: "2026-05-01" }],
    );
    expect(toInsert).toEqual([]);
  });
});

describe("row and insert mapping", () => {
  it("maps a row to a cleanup and a cleanup to an insertable row", () => {
    expect(rowToCleanup({ loggedOn: "2026-05-01" })).toEqual({
      loggedOn: "2026-05-01",
    });
    expect(cleanupToInsert("u1", { loggedOn: "2026-05-01" })).toEqual({
      userId: "u1",
      loggedOn: "2026-05-01",
    });
  });
});

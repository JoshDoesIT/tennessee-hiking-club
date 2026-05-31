// @vitest-environment node
import { describe, it, expect } from "vitest";
import { countUserPasskeys } from "./passkeys-server";

function db(rows: unknown[]) {
  return {
    select: () => ({ from: () => ({ where: async () => rows }) }),
  } as never;
}

describe("countUserPasskeys", () => {
  it("counts the registered passkeys for a user", async () => {
    expect(await countUserPasskeys(db([{}, {}]), "u1")).toBe(2);
  });

  it("is zero when the user has none", async () => {
    expect(await countUserPasskeys(db([]), "u1")).toBe(0);
  });
});

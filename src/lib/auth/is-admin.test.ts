import { describe, it, expect } from "vitest";
import { isAdmin } from "./is-admin";

describe("isAdmin", () => {
  const allowlist = "Octocat, ranger-rick";

  it("recognizes an allowlisted login case-insensitively", () => {
    expect(isAdmin("octocat", allowlist)).toBe(true);
    expect(isAdmin("Ranger-Rick", allowlist)).toBe(true);
  });

  it("rejects a login that is not on the allowlist", () => {
    expect(isAdmin("randomhiker", allowlist)).toBe(false);
  });

  it("rejects a missing login", () => {
    expect(isAdmin(null, allowlist)).toBe(false);
    expect(isAdmin(undefined, allowlist)).toBe(false);
    expect(isAdmin("", allowlist)).toBe(false);
  });

  it("rejects everyone when the allowlist is empty or unset", () => {
    expect(isAdmin("octocat", "")).toBe(false);
    expect(isAdmin("octocat", undefined)).toBe(false);
  });
});

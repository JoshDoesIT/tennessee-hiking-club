import { describe, it, expect } from "vitest";
import { appSignInPath } from "./app-signin";

describe("appSignInPath", () => {
  it("builds the native sign-in route for a provider", () => {
    expect(appSignInPath("github")).toBe("/api/app-signin/github");
    expect(appSignInPath("google")).toBe("/api/app-signin/google");
  });

  it("encodes the provider id", () => {
    expect(appSignInPath("a b")).toBe("/api/app-signin/a%20b");
  });
});

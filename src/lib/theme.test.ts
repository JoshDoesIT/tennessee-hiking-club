import { describe, it, expect } from "vitest";
import { shouldUseDarkTheme } from "./theme";

describe("shouldUseDarkTheme", () => {
  it("defaults to light when nothing is stored (ignores the OS preference)", () => {
    expect(shouldUseDarkTheme(null)).toBe(false);
  });

  it("uses dark only when the user explicitly chose it", () => {
    expect(shouldUseDarkTheme("dark")).toBe(true);
  });

  it("stays light for an explicit light preference", () => {
    expect(shouldUseDarkTheme("light")).toBe(false);
  });

  it("treats any stale or unknown value as light", () => {
    expect(shouldUseDarkTheme("system")).toBe(false);
  });
});

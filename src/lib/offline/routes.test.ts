import { describe, it, expect } from "vitest";
import { appRoutes, STATIC_ROUTES } from "./routes";

describe("appRoutes", () => {
  it("includes the core static pages", () => {
    const routes = appRoutes([]);
    for (const r of ["/", "/trails", "/explore", "/hikes", "/leaderboard"]) {
      expect(routes).toContain(r);
    }
  });

  it("adds a route for every trail slug", () => {
    const routes = appRoutes(["mount-leconte", "obed"]);
    expect(routes).toContain("/trails/mount-leconte");
    expect(routes).toContain("/trails/obed");
  });

  it("returns absolute paths with no duplicates", () => {
    const routes = appRoutes(["a", "a"]);
    expect(routes.every((r) => r.startsWith("/"))).toBe(true);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("does not include API or asset paths", () => {
    const routes = appRoutes(["a"]);
    expect(routes.some((r) => r.startsWith("/api/"))).toBe(false);
    expect(routes.some((r) => r.includes("."))).toBe(false);
    expect(STATIC_ROUTES.length).toBeGreaterThan(0);
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Guards the two build targets (spec 0009): the default web build stays the full
 * server app, while `CAPACITOR_BUILD=1` flips to a static export for the native
 * bundle. The config reads the env at module load, so each case re-imports it.
 */
async function loadConfig() {
  vi.resetModules();
  return (await import("../next.config")).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("next.config build targets", () => {
  it("emits a static export for the capacitor build", async () => {
    vi.stubEnv("CAPACITOR_BUILD", "1");
    const config = await loadConfig();
    expect(config.output).toBe("export");
    expect(config.images?.unoptimized).toBe(true);
    expect(config.trailingSlash).toBe(true);
  });

  it("keeps the full server app (sw headers, no export) on the web build", async () => {
    vi.stubEnv("CAPACITOR_BUILD", "");
    const config = await loadConfig();
    expect(config.output).toBeUndefined();
    expect(typeof config.headers).toBe("function");
  });
});

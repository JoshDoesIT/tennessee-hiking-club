import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Guards the Capacitor load modes (spec 0009). By default the app loads the
 * hosted site over `server.url`; `CAP_LOCAL_BUNDLE=1` loads the static export
 * bundled into the app (phase 3), while `CAP_SERVER_URL` still overrides for dev
 * live-reload. The config reads env at module load, so each case re-imports it.
 */
async function loadConfig() {
  vi.resetModules();
  return (await import("../capacitor.config")).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("capacitor config load modes", () => {
  it("loads the hosted site over server.url by default", async () => {
    vi.stubEnv("CAP_LOCAL_BUNDLE", "");
    vi.stubEnv("CAP_SERVER_URL", "");
    const config = await loadConfig();
    expect(config.webDir).toBe("mobile");
    expect(config.server?.url).toBe("https://www.tnhiking.club");
  });

  it("loads the local export bundle when CAP_LOCAL_BUNDLE=1", async () => {
    vi.stubEnv("CAP_LOCAL_BUNDLE", "1");
    vi.stubEnv("CAP_SERVER_URL", "");
    const config = await loadConfig();
    expect(config.webDir).toBe("out");
    // No remote server: the app opens locally with no network.
    expect(config.server?.url).toBeUndefined();
  });

  it("still honors CAP_SERVER_URL for dev live-reload in local-bundle mode", async () => {
    vi.stubEnv("CAP_LOCAL_BUNDLE", "1");
    vi.stubEnv("CAP_SERVER_URL", "http://10.0.2.2:3000");
    const config = await loadConfig();
    expect(config.server?.url).toBe("http://10.0.2.2:3000");
  });
});

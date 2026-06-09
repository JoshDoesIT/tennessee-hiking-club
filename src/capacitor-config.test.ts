import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Guards the Capacitor load modes (spec 0009). By default the app loads the
 * static export bundled into the app, so it opens with no network; set
 * `CAP_LOCAL_BUNDLE=0` to fall back to the hosted site over `server.url`, while
 * `CAP_SERVER_URL` still overrides the origin for dev live-reload. The config
 * reads env at module load, so each case re-imports it.
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
  it("loads the local export bundle with no server.url by default", async () => {
    vi.stubEnv("CAP_LOCAL_BUNDLE", "");
    vi.stubEnv("CAP_SERVER_URL", "");
    const config = await loadConfig();
    expect(config.webDir).toBe("out");
    // No remote server: the app opens locally with no network.
    expect(config.server?.url).toBeUndefined();
  });

  it("falls back to the hosted site over server.url when CAP_LOCAL_BUNDLE=0", async () => {
    vi.stubEnv("CAP_LOCAL_BUNDLE", "0");
    vi.stubEnv("CAP_SERVER_URL", "");
    const config = await loadConfig();
    expect(config.webDir).toBe("mobile");
    expect(config.server?.url).toBe("https://www.tnhiking.club");
  });

  it("still honors CAP_SERVER_URL for dev live-reload", async () => {
    vi.stubEnv("CAP_LOCAL_BUNDLE", "");
    vi.stubEnv("CAP_SERVER_URL", "http://10.0.2.2:3000");
    const config = await loadConfig();
    expect(config.server?.url).toBe("http://10.0.2.2:3000");
  });
});

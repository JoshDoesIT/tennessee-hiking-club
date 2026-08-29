import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

const root = process.cwd();

/**
 * The default load mode is the local bundle, which opens with no signal and so
 * never needs an offline fallback. The hosted escape-hatch mode
 * (`CAP_LOCAL_BUNDLE=0`) still navigates to `server.url`, which fails with no
 * signal; without a local `errorPath` the WebView shows a black screen (#248).
 * These lock in the branded offline fallback (option 1) for that mode so the
 * case is a friendly screen with a way back, not black.
 */
async function hostedConfig(): Promise<CapacitorConfig> {
  vi.resetModules();
  vi.stubEnv("CAP_LOCAL_BUNDLE", "0");
  vi.stubEnv("CAP_SERVER_URL", "");
  const config = (await import("../capacitor.config")).default;
  vi.unstubAllEnvs();
  return config;
}

function fallbackHtml(config: CapacitorConfig): string {
  const webDir = config.webDir ?? "";
  const errorPath = config.server?.errorPath ?? "";
  return readFileSync(join(root, webDir, errorPath), "utf8");
}

/** The offline page plus the local scripts it loads: the bundle that actually
 *  ships, so a guard on the way-back affordance follows it into reconnect.js. */
function fallbackBundle(config: CapacitorConfig): string {
  const dir = join(root, config.webDir ?? "");
  const html = fallbackHtml(config);
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((src) => !/^https?:\/\//.test(src))
    .map((src) => readFileSync(join(dir, src), "utf8"));
  return [html, ...scripts].join("\n");
}

describe("mobile offline fallback (#248, hosted mode)", () => {
  it("points server.errorPath at a page that exists in the webDir", async () => {
    const config = await hostedConfig();
    expect(config.server?.errorPath).toBeTruthy();
    // Throws if the file is missing, which is the bug this guards against.
    expect(fallbackHtml(config).length).toBeGreaterThan(0);
  });

  it("explains the app is offline rather than showing a blank screen", async () => {
    const config = await hostedConfig();
    expect(fallbackHtml(config)).toMatch(
      /offline|no signal|connect|reconnect/i,
    );
  });

  it("offers a way back into the hosted app once a connection returns", async () => {
    const config = await hostedConfig();
    expect(fallbackHtml(config)).toMatch(/try again|retry|reload|reconnect/i);
    // The reopen target + reconnect logic live in the page's linked script.
    expect(fallbackBundle(config)).toMatch(/tnhiking\.club/);
  });
});

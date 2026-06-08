import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import config from "../capacitor.config";

const root = process.cwd();

function fallbackHtml(): string {
  const webDir = config.webDir ?? "";
  const errorPath = config.server?.errorPath ?? "";
  return readFileSync(join(root, webDir, errorPath), "utf8");
}

/** The offline page plus the local scripts it loads: the bundle that actually
 *  ships, so a guard on the way-back affordance follows it into reconnect.js. */
function fallbackBundle(): string {
  const dir = join(root, config.webDir ?? "");
  const html = fallbackHtml();
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((src) => !/^https?:\/\//.test(src))
    .map((src) => readFileSync(join(dir, src), "utf8"));
  return [html, ...scripts].join("\n");
}

/**
 * Cold-launching the native app offline navigates to `server.url`, which fails
 * with no signal; without a local `errorPath` the WebView shows a black screen
 * (#248). These lock in the branded offline fallback (option 1) so that case is
 * a friendly screen with a way back, not black.
 */
describe("mobile offline fallback (#248)", () => {
  it("points server.errorPath at a page that exists in the webDir", () => {
    expect(config.server?.errorPath).toBeTruthy();
    // Throws if the file is missing, which is the bug this guards against.
    expect(fallbackHtml().length).toBeGreaterThan(0);
  });

  it("explains the app is offline rather than showing a blank screen", () => {
    expect(fallbackHtml()).toMatch(/offline|no signal|connect|reconnect/i);
  });

  it("offers a way back into the hosted app once a connection returns", () => {
    expect(fallbackHtml()).toMatch(/try again|retry|reload|reconnect/i);
    // The reopen target + reconnect logic live in the page's linked script.
    expect(fallbackBundle()).toMatch(/tnhiking\.club/);
  });
});

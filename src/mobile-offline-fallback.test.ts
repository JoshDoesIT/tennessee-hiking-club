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
    const html = fallbackHtml();
    expect(html).toMatch(/tnhiking\.club/);
    expect(html).toMatch(/try again|retry|reload|reconnect/i);
  });
});

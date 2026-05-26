import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf-8");

describe("global styles", () => {
  // The map (and the rest of the UI) respects prefers-reduced-motion through
  // this site-wide rule; MapLibre additionally skips camera animation under
  // reduced motion by default.
  it("honors prefers-reduced-motion by neutralizing motion", () => {
    const start = css.indexOf("prefers-reduced-motion");
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, start + 400);
    expect(block).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
  });

  // Focused pins (and every other focusable control) get a visible ring.
  it("provides a visible focus indicator for keyboard users", () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/);
  });
});

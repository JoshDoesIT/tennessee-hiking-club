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

describe("Peak + Pin brand tokens (spec 0010)", () => {
  // The Concept 5 palette, verbatim from the brand sheet. Legacy token names
  // are re-valued (the whole app shifts), canonical aliases added for new code.
  it.each([
    ["deep pine", "#15352a"],
    ["forest green", "#1e4d3a"],
    ["sage", "#8ba888"],
    ["mist", "#c7d2c1"],
    ["tn orange", "#f47c20"],
    ["stone", "#f5f6f3"],
  ])("carries the %s hex from the brand sheet", (_name, hex) => {
    expect(css.toLowerCase()).toContain(hex);
  });

  it("defines canonical Concept-5 aliases", () => {
    for (const token of [
      "--color-deep-pine",
      "--color-mist",
      "--color-stone",
      "--color-tn-orange",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("defines the pin-drop and pin-ping motion language", () => {
    expect(css).toMatch(/@keyframes pin-drop/);
    expect(css).toMatch(/@keyframes pin-ping/);
    expect(css).toMatch(/--animate-pin-drop/);
    expect(css).toMatch(/--animate-pin-ping/);
  });

  it("guards scroll-driven parallax behind @supports", () => {
    expect(css).toMatch(/@supports\s*\(animation-timeline:\s*scroll\(\)\)/);
  });
});

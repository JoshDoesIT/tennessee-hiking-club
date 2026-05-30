import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SkyBackdrop } from "./sky-backdrop";

describe("SkyBackdrop", () => {
  it("renders the day sun and the night crescent moon for the theme crossfade", () => {
    const { container } = render(<SkyBackdrop />);
    expect(container.querySelector('[data-celestial="sun"]')).not.toBeNull();
    expect(container.querySelector('[data-celestial="moon"]')).not.toBeNull();
    // The moon is a masked crescent, not a flat disc.
    expect(container.querySelector("#sky-moon-mask")).not.toBeNull();
  });

  it("fills the sky with a generous field of twinkling stars", () => {
    const { container } = render(<SkyBackdrop />);
    expect(
      container.querySelectorAll(".animate-twinkle").length,
    ).toBeGreaterThanOrEqual(24);
  });
});

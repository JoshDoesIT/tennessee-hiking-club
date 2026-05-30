import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Ridgeline } from "./ridgeline";

describe("Ridgeline", () => {
  it("renders both the day sun and the night moon with stars for the crossfade", () => {
    const { container } = render(<Ridgeline />);
    // Sun (shown by day) and moon glow (shown by night) both exist; CSS fades
    // between them by theme.
    expect(container.querySelector("#thc-sun")).not.toBeNull();
    expect(container.querySelector("#thc-moon-glow")).not.toBeNull();
  });

  it("draws the moon as a crescent, not a flat full disc", () => {
    const { container } = render(<Ridgeline />);
    // The crescent is cut from a disc with a mask, so it reads as a moon.
    expect(container.querySelector("#thc-moon-mask")).not.toBeNull();
  });

  it("scatters a generous field of twinkling stars across the sky band", () => {
    const { container } = render(<Ridgeline />);
    expect(
      container.querySelectorAll(".animate-twinkle").length,
    ).toBeGreaterThanOrEqual(12);
  });
});

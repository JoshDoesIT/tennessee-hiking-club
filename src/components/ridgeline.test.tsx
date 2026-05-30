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
    // A field of twinkling stars for night.
    expect(
      container.querySelectorAll(".animate-twinkle").length,
    ).toBeGreaterThan(0);
  });
});

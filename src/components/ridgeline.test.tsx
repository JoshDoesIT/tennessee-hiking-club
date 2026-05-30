import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Ridgeline } from "./ridgeline";

describe("Ridgeline", () => {
  it("renders the layered ridge silhouette (sun/moon/stars live in SkyBackdrop)", () => {
    const { container } = render(<Ridgeline />);
    // far, mid, near ridge + foreground treeline
    expect(container.querySelectorAll("path").length).toBe(4);
  });
});

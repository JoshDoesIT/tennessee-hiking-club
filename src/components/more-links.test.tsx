import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoreLinks } from "./more-links";

describe("MoreLinks", () => {
  it("links to every secondary page so nothing is unreachable on native", () => {
    render(<MoreLinks />);
    const expected: Array<[string, string]> = [
      ["About", "/about"],
      ["Contribute", "/contribute"],
      ["Leaderboard", "/leaderboard"],
      ["Leave No Trace", "/leave-no-trace"],
      ["Credits", "/credits"],
      ["Privacy", "/privacy"],
      ["Accessibility", "/accessibility"],
    ];
    for (const [label, href] of expected) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }
  });
});

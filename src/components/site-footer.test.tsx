import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("links to the credits page", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /credits/i })).toHaveAttribute(
      "href",
      "/credits",
    );
  });

  it("links out to the Facebook community group in a new tab", () => {
    render(<SiteFooter />);
    const fb = screen.getByRole("link", { name: /facebook group/i });
    expect(fb.getAttribute("href")).toContain("facebook.com");
    expect(fb).toHaveAttribute("target", "_blank");
  });

  it("links to the privacy and accessibility pages", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /^privacy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(
      screen.getByRole("link", { name: /^accessibility/i }),
    ).toHaveAttribute("href", "/accessibility");
  });
});

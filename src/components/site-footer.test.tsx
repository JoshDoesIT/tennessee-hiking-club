import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("links to the credits page", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("link", { name: /credits/i }),
    ).toHaveAttribute("href", "/credits");
  });
});

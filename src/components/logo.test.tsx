import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo, PeakPinMark } from "./logo";

describe("Logo (Peak + Pin lockup)", () => {
  it("renders the mark as inline SVG with an accessible name", () => {
    render(<Logo />);
    const mark = screen.getByRole("img", {
      name: /tennessee hiking club/i,
    });
    expect(mark.tagName.toLowerCase()).toBe("svg");
  });

  it("renders the wordmark and tagline", () => {
    render(<Logo />);
    expect(screen.getByText(/tn hiking club/i)).toBeInTheDocument();
    expect(screen.getByText(/explore tennessee together/i)).toBeInTheDocument();
  });

  it("can render the mark alone", () => {
    render(<Logo withWordmark={false} />);
    expect(screen.queryByText(/tn hiking club/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /tennessee hiking club/i }),
    ).toBeInTheDocument();
  });

  it("switches wordmark tone for dark surfaces", () => {
    const { container } = render(<Logo tone="light" />);
    expect(container.querySelector(".text-cream")).not.toBeNull();
  });
});

describe("PeakPinMark", () => {
  it("is decorative by default when used standalone", () => {
    const { container } = render(<PeakPinMark decorative />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});

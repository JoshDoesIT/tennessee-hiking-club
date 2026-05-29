import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AccessibilityPage from "./page";

describe("AccessibilityPage", () => {
  it("has an accessibility heading", () => {
    render(<AccessibilityPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /accessibility/i }),
    ).toBeInTheDocument();
  });

  it("states the conformance target, features, limitations, reporting, and a date", () => {
    const { container } = render(<AccessibilityPage />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/WCAG 2\.2 AA/i);
    expect(text).toMatch(/keyboard/i);
    expect(text).toMatch(/screen reader/i);
    expect(text).toMatch(/map/i); // known-limitation: the interactive map
    expect(text).toMatch(/report/i);
    expect(text).toMatch(/last reviewed/i);
  });

  it("links a way to report accessibility issues", () => {
    render(<AccessibilityPage />);
    const link = screen.getByRole("link", { name: /report an accessibility/i });
    expect(link.getAttribute("href")).toContain("github.com");
  });
});

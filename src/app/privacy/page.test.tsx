import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("has a privacy heading", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /privacy/i }),
    ).toBeInTheDocument();
  });

  it("covers the local-first model, processors, data control, and a date", () => {
    const { container } = render(<PrivacyPage />);
    const text = container.textContent ?? "";
    // Local-first + what is collected on sign-in.
    expect(text).toMatch(/local-first/i);
    expect(text).toMatch(/sign in/i);
    // Third-party processors.
    for (const name of ["GitHub", "Google", "Vercel", "Neon", "Stripe"]) {
      expect(text).toContain(name);
    }
    // Data control + last-updated.
    expect(text).toMatch(/export/i);
    expect(text).toMatch(/delete/i);
    expect(text).toMatch(/last updated/i);
  });
});

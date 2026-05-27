import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CreditsPage from "./page";

describe("CreditsPage", () => {
  it("states the photo-sourcing policy and the required attributions", () => {
    render(<CreditsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /credits/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/used with permission/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /openstreetmap/i }),
    ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
    expect(
      screen.getByRole("link", { name: /facebook group/i }),
    ).toBeInTheDocument();
  });
});

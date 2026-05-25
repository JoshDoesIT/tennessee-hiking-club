import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders children inside a surface", () => {
    render(<Card>Trail</Card>);
    const el = screen.getByText("Trail");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("rounded-2xl");
  });

  it("adds a hover lift when interactive", () => {
    render(<Card interactive>Trail</Card>);
    expect(screen.getByText("Trail").className).toContain(
      "hover:-translate-y-1",
    );
  });
});

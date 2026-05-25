import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its text", () => {
    render(<Badge>Soon</Badge>);
    expect(screen.getByText("Soon")).toBeInTheDocument();
  });

  it("applies the forest variant", () => {
    render(<Badge variant="forest">New</Badge>);
    expect(screen.getByText("New").className).toContain("bg-forest");
  });
});

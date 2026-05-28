import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

describe("NotFound (custom 404)", () => {
  it("renders a clear page-not-found heading and a way back", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /not found/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /trails/i })).toBeInTheDocument();
  });
});

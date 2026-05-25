import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TennesseeMap } from "./tennessee-map";
import { getAllTrails } from "@/lib/trails";

describe("TennesseeMap", () => {
  it("renders a pin link for every trail", () => {
    render(<TennesseeMap />);
    const pinLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/trails/"));
    expect(pinLinks).toHaveLength(getAllTrails().length);
  });

  it("links each pin to its trail page with an accessible name", () => {
    render(<TennesseeMap />);
    const trail = getAllTrails()[0];
    const link = screen.getByRole("link", {
      name: new RegExp(trail.name, "i"),
    });
    expect(link).toHaveAttribute("href", `/trails/${trail.slug}`);
  });
});

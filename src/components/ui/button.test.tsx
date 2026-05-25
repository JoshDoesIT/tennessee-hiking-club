import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Explore</Button>);
    expect(screen.getByRole("button", { name: "Explore" })).toBeInTheDocument();
  });

  it("applies the accent variant", () => {
    render(<Button variant="accent">Buy</Button>);
    expect(screen.getByRole("button", { name: "Buy" }).className).toContain(
      "bg-amber",
    );
  });

  it("merges a custom className", () => {
    render(<Button className="w-full">Wide</Button>);
    expect(screen.getByRole("button", { name: "Wide" }).className).toContain(
      "w-full",
    );
  });
});

describe("buttonVariants", () => {
  it("returns the primary classes by default", () => {
    expect(buttonVariants()).toContain("bg-forest");
  });

  it("returns outline classes for the outline variant", () => {
    expect(buttonVariants({ variant: "outline" })).toContain("border-forest");
  });
});

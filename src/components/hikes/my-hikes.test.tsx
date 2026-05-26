import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyHikes } from "./my-hikes";
import { addHike } from "@/lib/hikes/local-log";
import type { Trail } from "@/lib/trails/schema";

const make = (over: Partial<Trail>): Trail => ({
  slug: "x",
  name: "X",
  region: "East",
  area: "A",
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 5,
  elevationGainFt: 1000,
  difficulty: "moderate",
  routeType: "loop",
  tags: [],
  photos: [],
  summary: "s",
  body: "",
  ...over,
});

const trails: Trail[] = [
  make({ slug: "a", name: "Alpha", region: "East", lengthMiles: 11 }),
  make({ slug: "b", name: "Beta", region: "Middle", lengthMiles: 2 }),
];

beforeEach(() => localStorage.clear());

describe("MyHikes", () => {
  it("shows an empty state when nothing is logged", async () => {
    render(<MyHikes trails={trails} />);
    expect(await screen.findByText(/no hikes logged/i)).toBeInTheDocument();
  });

  it("lists logged trails with personal stats", async () => {
    addHike("a", "2026-01-01");
    render(<MyHikes trails={trails} />);
    expect(await screen.findByRole("link", { name: /Alpha/i })).toHaveAttribute(
      "href",
      "/trails/a",
    );
    expect(screen.getByText(/11 mi/)).toBeInTheDocument();
  });
});

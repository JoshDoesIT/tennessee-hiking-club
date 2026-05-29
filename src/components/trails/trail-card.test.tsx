import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrailCard } from "./trail-card";
import type { Trail } from "@/lib/trails/schema";

const trail: Trail = {
  slug: "mt-x",
  name: "Mount X",
  region: "East",
  area: "Great Smoky Mountains",
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 11,
  elevationGainFt: 2000,
  difficulty: "strenuous",
  routeType: "out-and-back",
  tags: [],
  photos: [{ src: "/trails/placeholder.png", alt: "Ridge at golden hour" }],
  summary: "A classic climb.",
  body: "",
  alerts: [],
  conditionReports: [],
};

describe("TrailCard", () => {
  it("links to the trail and shows its key stats", () => {
    render(<TrailCard trail={trail} />);
    const link = screen.getByRole("link", { name: /Mount X/i });
    expect(link).toHaveAttribute("href", "/trails/mt-x");
    expect(screen.getByText("East TN")).toBeInTheDocument();
    expect(screen.getByText(/strenuous/i)).toBeInTheDocument();
    expect(screen.getByText(/11 mi/)).toBeInTheDocument();
  });

  it("renders the trail thumbnail with its alt text", () => {
    render(<TrailCard trail={trail} />);
    expect(screen.getByAltText(/Ridge at golden hour/i)).toBeInTheDocument();
  });
});

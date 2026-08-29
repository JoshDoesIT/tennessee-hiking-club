import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrailParking } from "./trail-parking";

const parking = {
  lat: 35.83,
  lng: -85.29,
  note: "Gravel lot, about 20 spaces, no fee. 2WD ok.",
  seasonal: "Access road gated dusk to dawn in winter.",
};

describe("TrailParking", () => {
  it("shows the parking note", () => {
    render(<TrailParking parking={parking} />);
    expect(
      screen.getByText(/gravel lot, about 20 spaces/i),
    ).toBeInTheDocument();
  });

  it("shows the seasonal / accessibility note", () => {
    render(<TrailParking parking={parking} />);
    expect(screen.getByText(/gated dusk to dawn/i)).toBeInTheDocument();
  });

  it("links directions straight to the parking coordinates", () => {
    render(<TrailParking parking={parking} />);
    const link = screen.getByRole("link", { name: /directions to parking/i });
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("google.com/maps/dir");
    expect(href).toContain("destination=35.83");
  });

  it("renders without a note or seasonal block when none are given", () => {
    render(<TrailParking parking={{ lat: 35.83, lng: -85.29 }} />);
    expect(
      screen.getByRole("link", { name: /directions to parking/i }),
    ).toBeInTheDocument();
  });

  it("attributes OpenStreetMap when the parking is OSM-sourced", () => {
    render(<TrailParking parking={{ lat: 35.83, lng: -85.29 }} source="osm" />);
    const link = screen.getByRole("link", { name: /openstreetmap/i });
    expect(link.getAttribute("href") ?? "").toContain("openstreetmap.org");
  });

  it("shows no OSM attribution for declared content parking", () => {
    render(<TrailParking parking={parking} source="content" />);
    expect(screen.queryByRole("link", { name: /openstreetmap/i })).toBeNull();
  });
});

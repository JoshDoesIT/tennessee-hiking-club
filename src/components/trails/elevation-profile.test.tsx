import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ElevationProfile } from "./elevation-profile";

const route = [
  { lat: 35.6, lng: -83.45, elevationFt: 4000 },
  { lat: 35.62, lng: -83.44, elevationFt: 4600 },
  { lat: 35.64, lng: -83.43, elevationFt: 4400 },
  { lat: 35.66, lng: -83.42, elevationFt: 6593 },
];

describe("ElevationProfile", () => {
  it("shows a text summary of gain, high, and low", () => {
    render(<ElevationProfile route={route} />);
    expect(screen.getByText(/2,793 ft/)).toBeInTheDocument();
    expect(screen.getByText(/6,593 ft/)).toBeInTheDocument();
    expect(screen.getByText(/4,000 ft/)).toBeInTheDocument();
  });

  it("renders a decorative chart that screen readers skip", () => {
    const { container } = render(<ElevationProfile route={route} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders nothing for a route too short to chart", () => {
    const { container } = render(
      <ElevationProfile
        route={[{ lat: 35.6, lng: -83.45, elevationFt: 4000 }]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

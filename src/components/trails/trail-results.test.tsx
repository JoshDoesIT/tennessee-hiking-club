import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrailResults } from "./trail-results";
import type { Trail } from "@/lib/trails/schema";

const make = (slug: string, name: string, lat: number, lng: number): Trail => ({
  slug,
  name,
  region: "East",
  area: "A",
  coordinates: { lat, lng },
  lengthMiles: 5,
  elevationGainFt: 1000,
  difficulty: "moderate",
  routeType: "loop",
  tags: [],
  photos: [],
  summary: "s",
  body: "",
  alerts: [],
  conditionReports: [],
});

const trails = [
  make("far", "Far Trail", 36.3, -82.0),
  make("near", "Near Trail", 35.96, -83.92),
  make("mid", "Mid Trail", 35.6, -85.3),
];

const headingOrder = () =>
  screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

function mockGeolocation(
  impl: (
    success: PositionCallback,
    error?: PositionErrorCallback,
  ) => void,
) {
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition: impl },
    configurable: true,
  });
}

describe("TrailResults", () => {
  it("renders trails in the given order with an opt-in, privacy-stated control", () => {
    render(<TrailResults trails={trails} />);
    expect(
      screen.getByRole("button", { name: /sort by distance from me/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/stays on (your|this) device/i)).toBeInTheDocument();
    expect(headingOrder()).toEqual(["Far Trail", "Near Trail", "Mid Trail"]);
  });

  it("sorts nearest-first and shows distances once location is granted", async () => {
    mockGeolocation((success) =>
      success({
        coords: { latitude: 35.96, longitude: -83.92 },
      } as GeolocationPosition),
    );
    const user = userEvent.setup();
    render(<TrailResults trails={trails} />);

    await user.click(
      screen.getByRole("button", { name: /sort by distance from me/i }),
    );

    expect(headingOrder()[0]).toBe("Near Trail");
    expect(screen.getAllByText(/mi away/i).length).toBeGreaterThan(0);
  });

  it("keeps the default order and explains when location is denied", async () => {
    mockGeolocation((_success, error) =>
      error?.({ code: 1, message: "denied" } as GeolocationPositionError),
    );
    const user = userEvent.setup();
    render(<TrailResults trails={trails} />);

    await user.click(
      screen.getByRole("button", { name: /sort by distance from me/i }),
    );

    expect(headingOrder()).toEqual(["Far Trail", "Near Trail", "Mid Trail"]);
    expect(screen.getByRole("status").textContent).toMatch(
      /location|default order/i,
    );
  });
});

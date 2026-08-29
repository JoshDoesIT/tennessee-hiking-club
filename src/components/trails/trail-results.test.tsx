import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrailResults } from "./trail-results";
import {
  isLocationEnabled,
  setLocationEnabled,
} from "@/lib/maps/location-pref";
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
  impl: (success: PositionCallback, error?: PositionErrorCallback) => void,
) {
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition: impl },
    configurable: true,
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("TrailResults", () => {
  it("renders trails in the given order with an opt-in, privacy-stated control", () => {
    render(<TrailResults trails={trails} />);
    expect(
      screen.getByRole("button", { name: /sort by distance from me/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/stays on (your|this) device/i),
    ).toBeInTheDocument();
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

  it("remembers the location preference after a successful distance sort", async () => {
    mockGeolocation((success) =>
      success({
        coords: { latitude: 35.96, longitude: -83.92 },
      } as GeolocationPosition),
    );
    expect(isLocationEnabled()).toBe(false);
    const user = userEvent.setup();
    render(<TrailResults trails={trails} />);

    await user.click(
      screen.getByRole("button", { name: /sort by distance from me/i }),
    );

    expect(isLocationEnabled()).toBe(true);
  });

  it("auto-sorts by distance on mount once the member has shared before", async () => {
    setLocationEnabled(true);
    mockGeolocation((success) =>
      success({
        coords: { latitude: 35.96, longitude: -83.92 },
      } as GeolocationPosition),
    );

    render(<TrailResults trails={trails} />);

    await waitFor(() => expect(headingOrder()[0]).toBe("Near Trail"));
  });

  it("does not auto-request location when the member has never shared", () => {
    let requested = false;
    mockGeolocation(() => {
      requested = true;
    });

    render(<TrailResults trails={trails} />);

    expect(requested).toBe(false);
    expect(headingOrder()).toEqual(["Far Trail", "Near Trail", "Mid Trail"]);
  });
});

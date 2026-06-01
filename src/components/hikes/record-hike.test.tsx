import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordHike } from "./record-hike";
import { readLog } from "@/lib/hikes/local-log";

function mockGeolocation() {
  let success: PositionCallback | null = null;
  let failure: PositionErrorCallback | null = null;
  const watchPosition = vi.fn((s: PositionCallback, e: PositionErrorCallback) => {
    success = s;
    failure = e;
    return 7;
  });
  const clearWatch = vi.fn();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { watchPosition, clearWatch, getCurrentPosition: vi.fn() },
  });
  return {
    watchPosition,
    clearWatch,
    emit: (lat: number, lng: number, altitude: number | null = null) =>
      act(() =>
        success?.({
          coords: { latitude: lat, longitude: lng, altitude },
        } as GeolocationPosition),
      ),
    fail: () => act(() => failure?.({} as GeolocationPositionError)),
  };
}

beforeEach(() => localStorage.clear());
afterEach(() =>
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: undefined,
  }),
);

describe("RecordHike", () => {
  it("starts a watch and shows the live controls", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(<RecordHike slug="grotto-falls" trailName="Grotto Falls" />);

    await user.click(screen.getByRole("button", { name: /record this hike/i }));
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /finish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("shows the live point count as positions arrive", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(<RecordHike slug="grotto-falls" trailName="Grotto Falls" />);

    await user.click(screen.getByRole("button", { name: /record this hike/i }));
    geo.emit(35.6, -83.45, 1000);
    geo.emit(35.62, -83.44, 1100);
    expect(screen.getByText(/2 pts/)).toBeInTheDocument();
  });

  it("saves the recorded track to the log and stops the watch on finish", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(<RecordHike slug="grotto-falls" trailName="Grotto Falls" />);

    await user.click(screen.getByRole("button", { name: /record this hike/i }));
    geo.emit(35.6, -83.45, 1000);
    geo.emit(35.62, -83.44, 1100);
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(geo.clearWatch).toHaveBeenCalled();
    const entry = readLog().find((e) => e.trailSlug === "grotto-falls");
    expect(entry?.track?.points.length).toBeGreaterThanOrEqual(2);
  });

  it("does not save when too few points were recorded", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(<RecordHike slug="grotto-falls" trailName="Grotto Falls" />);

    await user.click(screen.getByRole("button", { name: /record this hike/i }));
    geo.emit(35.6, -83.45, 1000);
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(readLog()).toEqual([]);
    expect(screen.getByText(/not enough/i)).toBeInTheDocument();
  });

  it("pauses the watch and offers resume", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(<RecordHike slug="grotto-falls" trailName="Grotto Falls" />);

    await user.click(screen.getByRole("button", { name: /record this hike/i }));
    await user.click(screen.getByRole("button", { name: /pause/i }));

    expect(geo.clearWatch).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
  });

  it("reports when location is unavailable", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
    const user = userEvent.setup();
    render(<RecordHike slug="grotto-falls" trailName="Grotto Falls" />);

    await user.click(screen.getByRole("button", { name: /record this hike/i }));
    expect(screen.getByText(/isn.t available/i)).toBeInTheDocument();
  });
});

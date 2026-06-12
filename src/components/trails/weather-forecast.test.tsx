import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { WeatherForecast } from "./weather-forecast";
import type { TrailWeather } from "@/lib/weather/forecast";

const weather: TrailWeather = {
  current: { tempF: 72, code: 2, label: "Partly cloudy" },
  daily: [
    {
      date: "2026-05-26",
      code: 3,
      label: "Overcast",
      highF: 78,
      lowF: 55,
      precipProbPct: 10,
    },
    {
      date: "2026-05-27",
      code: 61,
      label: "Rain",
      highF: 70,
      lowF: 52,
      precipProbPct: 80,
    },
    {
      date: "2026-05-28",
      code: 0,
      label: "Clear",
      highF: 81,
      lowF: 59,
      precipProbPct: 0,
    },
  ],
  sunrise: "2026-05-26T06:12",
  sunset: "2026-05-26T20:34",
};

describe("WeatherForecast", () => {
  it("shows current conditions, sun times, and a multi-day forecast", () => {
    render(<WeatherForecast weather={weather} />);

    expect(
      screen.getByRole("heading", { name: /weather/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/72°/)).toBeInTheDocument();
    expect(screen.getByText(/partly cloudy/i)).toBeInTheDocument();
    expect(screen.getByText(/6:12\s*AM/i)).toBeInTheDocument();
    expect(screen.getByText(/8:34\s*PM/i)).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[1]).getByText(/rain/i)).toBeInTheDocument();
    expect(within(items[1]).getByText(/80%/)).toBeInTheDocument();
  });

  it("falls back gracefully when weather is unavailable", () => {
    render(<WeatherForecast weather={null} />);
    expect(
      screen.getByRole("heading", { name: /weather/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});

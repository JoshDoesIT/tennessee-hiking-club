import { describe, it, expect } from "vitest";
import {
  buildForecastUrl,
  parseForecast,
  weatherLabel,
  fetchTrailWeather,
} from "./forecast";

const sample = {
  current: { temperature_2m: 72.4, weather_code: 2 },
  daily: {
    time: ["2026-05-26", "2026-05-27", "2026-05-28"],
    weather_code: [3, 61, 0],
    temperature_2m_max: [78.1, 70.2, 81.5],
    temperature_2m_min: [55.0, 52.3, 58.9],
    precipitation_probability_max: [10, 80, 0],
    sunrise: ["2026-05-26T06:12", "2026-05-27T06:11", "2026-05-28T06:11"],
    sunset: ["2026-05-26T20:34", "2026-05-27T20:35", "2026-05-28T20:36"],
  },
};

describe("buildForecastUrl", () => {
  it("requests Fahrenheit, auto timezone, sun times, and a few days", () => {
    const url = buildForecastUrl(35.66, -83.44);
    expect(url).toContain("latitude=35.66");
    expect(url).toContain("longitude=-83.44");
    expect(url).toContain("temperature_unit=fahrenheit");
    expect(url).toMatch(/forecast_days=\d/);
    expect(url).toContain("sunrise");
  });
});

describe("weatherLabel", () => {
  it("maps WMO codes to readable labels", () => {
    expect(weatherLabel(0)).toMatch(/clear/i);
    expect(weatherLabel(2)).toMatch(/cloud/i);
    expect(weatherLabel(61)).toMatch(/rain/i);
    expect(weatherLabel(71)).toMatch(/snow/i);
    expect(weatherLabel(95)).toMatch(/thunder/i);
  });
});

describe("parseForecast", () => {
  const w = parseForecast(sample);

  it("reads and rounds current conditions", () => {
    expect(w.current?.tempF).toBe(72);
    expect(w.current?.label).toMatch(/cloud/i);
  });

  it("builds a daily forecast with rounded hi/lo and precip", () => {
    expect(w.daily).toHaveLength(3);
    expect(w.daily[0]).toMatchObject({
      date: "2026-05-26",
      highF: 78,
      lowF: 55,
      precipProbPct: 10,
    });
    expect(w.daily[1].label).toMatch(/rain/i);
  });

  it("carries sunrise and sunset for the first day", () => {
    expect(w.sunrise).toBe("2026-05-26T06:12");
    expect(w.sunset).toBe("2026-05-26T20:34");
  });
});

describe("fetchTrailWeather", () => {
  it("returns parsed weather on success", async () => {
    const fakeFetch = (async () =>
      ({ ok: true, json: async () => sample }) as unknown as Response) as typeof fetch;
    const w = await fetchTrailWeather(35.66, -83.44, fakeFetch);
    expect(w?.daily).toHaveLength(3);
  });

  it("returns null when the API responds not-ok", async () => {
    const fakeFetch = (async () =>
      ({ ok: false, json: async () => ({}) }) as unknown as Response) as typeof fetch;
    expect(await fetchTrailWeather(1, 1, fakeFetch)).toBeNull();
  });

  it("returns null when the request throws", async () => {
    const fakeFetch = (async () => {
      throw new Error("network");
    }) as typeof fetch;
    expect(await fetchTrailWeather(1, 1, fakeFetch)).toBeNull();
  });
});

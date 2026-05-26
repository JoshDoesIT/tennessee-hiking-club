import { z } from "zod";

/**
 * Trailhead weather via Open-Meteo: free, no API key, and cached server-side so
 * each trailhead hits the API at most once an hour. Failures degrade to `null`
 * and the UI shows a graceful fallback, so weather never breaks a trail page.
 */
const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const FORECAST_DAYS = 3;
const REVALIDATE_SECONDS = 3600;

export type DailyForecast = {
  date: string;
  code: number;
  label: string;
  highF: number;
  lowF: number;
  precipProbPct: number | null;
};

export type TrailWeather = {
  current: { tempF: number; code: number; label: string } | null;
  daily: DailyForecast[];
  sunrise: string;
  sunset: string;
};

/** WMO weather-code to a short, readable label. */
export function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
}

export function buildForecastUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    temperature_unit: "fahrenheit",
    timezone: "auto",
    forecast_days: String(FORECAST_DAYS),
  });
  return `${ENDPOINT}?${params.toString()}`;
}

const responseSchema = z.object({
  current: z
    .object({ temperature_2m: z.number(), weather_code: z.number() })
    .optional(),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number().nullable()).optional(),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
  }),
});

export function parseForecast(json: unknown): TrailWeather {
  const data = responseSchema.parse(json);
  const d = data.daily;

  const daily: DailyForecast[] = d.time.map((date, i) => ({
    date,
    code: d.weather_code[i],
    label: weatherLabel(d.weather_code[i]),
    highF: Math.round(d.temperature_2m_max[i]),
    lowF: Math.round(d.temperature_2m_min[i]),
    precipProbPct: d.precipitation_probability_max?.[i] ?? null,
  }));

  return {
    current: data.current
      ? {
          tempF: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          label: weatherLabel(data.current.weather_code),
        }
      : null,
    daily,
    sunrise: d.sunrise[0] ?? "",
    sunset: d.sunset[0] ?? "",
  };
}

export async function fetchTrailWeather(
  lat: number,
  lng: number,
  fetchImpl: typeof fetch = fetch,
): Promise<TrailWeather | null> {
  try {
    const res = await fetchImpl(buildForecastUrl(lat, lng), {
      next: { revalidate: REVALIDATE_SECONDS },
    } as RequestInit);
    if (!res.ok) return null;
    return parseForecast(await res.json());
  } catch {
    return null;
  }
}

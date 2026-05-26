import type { TrailWeather } from "@/lib/weather/forecast";

/** "2026-05-26T06:12" -> "6:12 AM" (parsed from the string to avoid TZ drift). */
function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "";
  let hour = Number(m[1]);
  const minute = m[2];
  const meridiem = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${meridiem}`;
}

function dayLabel(date: string, index: number): string {
  if (index === 0) return "Today";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

/**
 * Trailhead forecast: current conditions, sunrise/sunset, and the next few
 * days. Renders a graceful fallback when `weather` is `null` so a failed or
 * unavailable API never blanks the trail page.
 */
export function WeatherForecast({ weather }: { weather: TrailWeather | null }) {
  return (
    <section aria-labelledby="weather-heading" className="mt-8">
      <h2 id="weather-heading" className="display text-forest text-2xl">
        Weather at the trailhead
      </h2>

      {weather ? (
        <div className="border-forest/10 bg-cream-50 mt-4 rounded-2xl border p-5">
          {weather.current ? (
            <p className="text-forest flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl font-semibold">
                {weather.current.tempF}&deg;F
              </span>
              <span className="text-ink/70 text-sm">
                {weather.current.label} now
              </span>
            </p>
          ) : null}

          {weather.sunrise && weather.sunset ? (
            <p className="text-ink/70 mt-1 text-sm">
              Sunrise {formatTime(weather.sunrise)} &middot; Sunset{" "}
              {formatTime(weather.sunset)}
            </p>
          ) : null}

          <ul role="list" className="mt-4 grid gap-2 sm:grid-cols-3">
            {weather.daily.map((day, i) => (
              <li
                key={day.date}
                className="border-forest/10 flex flex-col rounded-xl border px-3 py-2"
              >
                <span className="text-forest text-sm font-semibold">
                  {dayLabel(day.date, i)}
                </span>
                <span className="text-ink/80 text-sm">{day.label}</span>
                <span className="text-ink/70 text-sm">
                  {day.highF}&deg; / {day.lowF}&deg;F
                </span>
                {day.precipProbPct !== null ? (
                  <span className="text-olive text-xs font-medium">
                    {day.precipProbPct}% precip
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="text-ink/70 mt-3 text-xs">
            Forecast from Open-Meteo. Mountain conditions change fast; check
            again before you go.
          </p>
        </div>
      ) : (
        <p className="text-ink/70 mt-4 text-sm">
          Forecast unavailable right now. Try again closer to your hike.
        </p>
      )}
    </section>
  );
}

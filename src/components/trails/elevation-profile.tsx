import { buildElevationProfile, type RoutePoint } from "@/lib/trails/elevation";

/**
 * Distance-vs-elevation profile for a trail's route. The chart is decorative
 * (aria-hidden); the text summary above it is the accessible alternative,
 * conveying total distance, climbing, and the high and low points.
 */
export function ElevationProfile({ route }: { route: RoutePoint[] }) {
  if (route.length < 2) return null;

  const { points, totalMiles, gainFt, highFt, lowFt } =
    buildElevationProfile(route);

  const W = 600;
  const H = 160;
  const span = highFt - lowFt || 1;
  const total = totalMiles || 1;
  const coords = points.map((p) => {
    const x = (p.distanceMi / total) * W;
    const y = H - ((p.elevationFt - lowFt) / span) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = coords.join(" ");
  const area = `0,${H} ${line} ${W},${H}`;
  const fmt = (n: number) => n.toLocaleString("en-US");
  // Built as a single string so JSX whitespace handling can't drop the spaces
  // between the numbers and their units.
  const summary = `${totalMiles.toFixed(1)} mi · ${fmt(gainFt)} ft of climbing · high ${fmt(highFt)} ft · low ${fmt(lowFt)} ft`;

  return (
    <section aria-labelledby="elevation-heading" className="mt-8">
      <h2 id="elevation-heading" className="display text-forest text-2xl">
        Elevation
      </h2>
      <p className="text-ink/75 mt-2 text-sm">{summary}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        preserveAspectRatio="none"
        className="border-forest/10 bg-cream-50 mt-3 h-40 w-full rounded-xl border"
      >
        <polygon points={area} className="fill-sage/20" />
        <polyline
          points={line}
          fill="none"
          className="stroke-pine"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </section>
  );
}

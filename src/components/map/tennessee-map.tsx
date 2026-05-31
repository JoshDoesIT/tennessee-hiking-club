import Link from "next/link";
import { MAP_WIDTH, MAP_HEIGHT } from "@/lib/geo/projection";
import { getAllTrails } from "@/lib/trails";
import { tennesseeMapData } from "./map-data";

/**
 * Stylized, clickable map of Tennessee. Server-rendered: the SVG outline is
 * drawn with d3-geo (via `tennesseeMapData`) and each trail is an HTML pin link
 * positioned by its projected coordinate (as a % of the viewBox, so it scales
 * responsively). No client JS; tooltips are CSS-only and pins are real links.
 */
export function TennesseeMap() {
  const { outline, pins } = tennesseeMapData(getAllTrails());

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-x-clip">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Map of Tennessee showing hiking trail locations"
      >
        <path
          d={outline}
          className="fill-sage-100/50 stroke-forest"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>

      {pins.map((pin) => (
        <Link
          key={pin.slug}
          href={`/trails/${pin.slug}`}
          aria-label={`${pin.name}, ${pin.region} Tennessee`}
          className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
        >
          <span
            aria-hidden="true"
            className="bg-amber ring-forest block h-3 w-3 rounded-full ring-2 transition-transform group-hover:scale-150 group-focus-visible:scale-150 motion-reduce:transition-none"
          />
          <span
            role="tooltip"
            className="night-panel bg-forest text-cream pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
          >
            {pin.name} · {pin.region} TN
          </span>
        </Link>
      ))}
    </div>
  );
}

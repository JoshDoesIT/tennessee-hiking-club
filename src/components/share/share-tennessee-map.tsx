import Link from "next/link";
import { cn } from "@/lib/cn";
import { MAP_WIDTH, MAP_HEIGHT } from "@/lib/geo/projection";
import type { TennesseeMapData } from "@/components/map/map-data";

/**
 * Stylized Tennessee map with a fixed set of hiked slugs highlighted. Server
 * renderable (no hooks, no local-log read), so it can power the public
 * `/share/my-tennessee/...` page where the slugs come from the URL rather
 * than the visitor's device.
 */
export function ShareTennesseeMap({
  data,
  hikedSlugs,
}: {
  data: TennesseeMapData;
  hikedSlugs: string[];
}) {
  const hikedSet = new Set(hikedSlugs);

  return (
    <figure className="m-0">
      <div className="relative mx-auto w-full max-w-4xl">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Tennessee map with hiked trails highlighted"
        >
          <path
            d={data.outline}
            className="fill-sage-100/50 stroke-forest"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>

        {data.pins.map((pin) => {
          const hiked = hikedSet.has(pin.slug);
          return (
            <Link
              key={pin.slug}
              href={`/trails/${pin.slug}`}
              data-hiked={hiked ? "true" : "false"}
              aria-label={`${pin.name}, ${pin.region} Tennessee.${hiked ? " Hiked." : ""}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block rounded-full transition-transform group-hover:scale-150 group-focus-visible:scale-150 motion-reduce:transition-none",
                  hiked
                    ? "bg-amber ring-forest h-3.5 w-3.5 ring-2"
                    : "bg-forest/15 ring-forest/40 h-2.5 w-2.5 ring-1",
                )}
              />
            </Link>
          );
        })}
      </div>

      <figcaption className="text-ink/70 mt-3 text-center text-sm">
        <span className="text-forest font-semibold">
          {hikedSlugs.length} of {data.pins.length}
        </span>{" "}
        trails hiked
      </figcaption>
    </figure>
  );
}

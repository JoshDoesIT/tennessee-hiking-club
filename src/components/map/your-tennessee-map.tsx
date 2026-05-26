"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
} from "@/lib/hikes/local-log";
import { MAP_WIDTH, MAP_HEIGHT } from "@/lib/geo/projection";
import type { TennesseeMapData } from "./map-data";

/**
 * Personal "trophy case" version of the stylized map. Takes the server-built
 * outline and pins, then lights up the trails in the local hike log; un-hiked
 * trails stay muted. Hiked state is reflected in each pin's accessible name,
 * not just colour. Local-first, so it works before sign-in.
 */
export function YourTennesseeMap({ data }: { data: TennesseeMapData }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );
  const hikedSlugs = new Set(log.map((e) => e.trailSlug));
  const hikedCount = data.pins.filter((p) => hikedSlugs.has(p.slug)).length;

  return (
    <figure className="m-0">
      <div className="relative mx-auto w-full max-w-4xl">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Your hiked trails across Tennessee"
        >
          <path
            d={data.outline}
            className="fill-sage-100/50 stroke-forest"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>

        {data.pins.map((pin) => {
          const hiked = hikedSlugs.has(pin.slug);
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
              <span
                role="tooltip"
                className="bg-forest text-cream pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
              >
                {pin.name} · {pin.region} TN{hiked ? " · hiked" : ""}
              </span>
            </Link>
          );
        })}
      </div>

      <figcaption className="text-ink/70 mt-3 text-center text-sm">
        <span className="text-forest font-semibold">
          {hikedCount} of {data.pins.length}
        </span>{" "}
        trails hiked
      </figcaption>
    </figure>
  );
}

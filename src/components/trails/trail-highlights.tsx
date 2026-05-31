import type { Waypoint } from "@/lib/trails/schema";
import { WAYPOINT_LABEL, WAYPOINT_COLOR } from "./waypoint-style";

/**
 * "Along the trail" (#189): the named landmarks (waterfalls, viewpoints,
 * summits, …) a hiker passes, in route order. Omitted entirely when a trail has
 * no waypoints.
 */
export function TrailHighlights({ waypoints }: { waypoints?: Waypoint[] }) {
  if (!waypoints?.length) return null;

  return (
    <section aria-labelledby="highlights-heading" className="mt-10">
      <h2 id="highlights-heading" className="display text-forest text-2xl">
        Along the trail
      </h2>
      <ul className="mt-4 space-y-3">
        {waypoints.map((w, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: WAYPOINT_COLOR[w.type] }}
            />
            <div>
              <p className="text-forest font-medium">
                {w.name}{" "}
                <span className="text-olive text-xs font-semibold tracking-wider uppercase">
                  · {WAYPOINT_LABEL[w.type]}
                </span>
              </p>
              {w.description ? (
                <p className="text-ink/70 mt-0.5 text-sm leading-relaxed">
                  {w.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

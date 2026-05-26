import { geoPath } from "d3-geo";
import { TENNESSEE } from "@/lib/geo/tennessee";
import {
  tennesseeProjection,
  projectPoint,
  MAP_WIDTH,
  MAP_HEIGHT,
} from "@/lib/geo/projection";
import type { Trail } from "@/lib/trails/schema";

/** A trail positioned on the stylized map, as a percentage of the viewBox. */
export type MapPin = {
  slug: string;
  name: string;
  region: string;
  xPct: number;
  yPct: number;
};

export type TennesseeMapData = {
  /** SVG path for the Tennessee outline, drawn into the fixed viewBox. */
  outline: string;
  pins: MapPin[];
};

/**
 * Shape trails into everything the stylized map needs to render: the state
 * outline and one positioned pin per trail. Runs d3-geo, so keep it on the
 * server and pass the (serializable) result to client map components.
 */
export function tennesseeMapData(trails: Trail[]): TennesseeMapData {
  const projection = tennesseeProjection();
  const outline = geoPath(projection)(TENNESSEE) ?? "";

  const pins: MapPin[] = trails.map((trail) => {
    const [x, y] = projectPoint(
      trail.coordinates.lng,
      trail.coordinates.lat,
      projection,
    );
    return {
      slug: trail.slug,
      name: trail.name,
      region: trail.region,
      xPct: (x / MAP_WIDTH) * 100,
      yPct: (y / MAP_HEIGHT) * 100,
    };
  });

  return { outline, pins };
}

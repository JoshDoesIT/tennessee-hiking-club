import type { RoutePoint } from "./elevation";

/**
 * Pure helpers for building a trail `route` (#140) from a real `.gpx` track
 * (an official park route or a recorded hike). The GPX carries the geometry and
 * elevation; this module only parses, downsamples, and serialises.
 */
const FEET_PER_METER = 3.28084;

export function metersToFeet(m: number): number {
  return Math.round(m * FEET_PER_METER);
}

function attr(attrs: string, name: string): number {
  const m = attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`));
  return m ? Number(m[1]) : NaN;
}

/** Parse track points (with elevation) from a GPX track. */
export function parseGpxTrack(xml: string): {
  name: string | null;
  points: RoutePoint[];
} {
  const nameMatch = xml.match(/<name>\s*([\s\S]*?)\s*<\/name>/);
  const name = nameMatch ? nameMatch[1].trim() : null;

  const points: RoutePoint[] = [];
  const re = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const lat = attr(m[1], "lat");
    const lng = attr(m[1], "lon");
    const ele = m[2].match(/<ele>\s*([-\d.eE+]+)\s*<\/ele>/);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !ele) continue;
    points.push({ lat, lng, elevationFt: metersToFeet(Number(ele[1])) });
  }
  return { name, points };
}

/** Evenly reduce a route to at most `maxPoints`, always keeping the endpoints. */
export function downsampleRoute<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints || maxPoints < 2) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  const out: T[] = [];
  for (let i = 0; i < maxPoints; i++) out.push(points[Math.round(i * step)]);
  out[out.length - 1] = points[points.length - 1];
  return out;
}

/** Serialise a route as trail front-matter (numbers, so it round-trips). */
export function routeFrontmatterYaml(route: RoutePoint[]): string {
  const lines = ["route:"];
  for (const p of route) {
    lines.push(
      `  - lat: ${p.lat}`,
      `    lng: ${p.lng}`,
      `    elevationFt: ${p.elevationFt}`,
    );
  }
  return lines.join("\n");
}

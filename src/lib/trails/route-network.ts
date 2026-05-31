import type { LatLng } from "./route-geometry";

/**
 * Shortest-path routing over an OpenStreetMap path network (#140).
 *
 * The named-way importer fails when a trail's ways are unnamed or fragmented.
 * This routes over the raw geometry instead: every path/footway/track within
 * range becomes graph edges, ways are joined where they share a junction node
 * (identical coordinates in `out geom`), small gaps are bridged by proximity,
 * and Dijkstra finds the actual on-trail path from the trailhead to a
 * destination (a waterfall, summit, or tower). `networkLoop` returns a circuit
 * for loop trails. Pure and tested; the network fetch lives in
 * `scripts/import-route.ts`.
 */

type OverpassGeom = {
  elements?: Array<{ type?: string; geometry?: Array<{ lat: number; lon: number }> }>;
};

type Edge = { to: string; w: number };
type Graph = { coord: Map<string, LatLng>; adj: Map<string, Edge[]> };

function key(lat: number, lon: number): string {
  // Shared OSM junction nodes carry identical coordinates in `out geom`, so
  // keying on the rounded coordinate joins the ways that meet there.
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function meters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t;
  const dLng = (b.lng - a.lng) * t;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Build the routing graph from path-way geometry, bridging gaps <= `snapMeters`. */
function buildGraph(json: OverpassGeom, snapMeters: number): Graph {
  const coord = new Map<string, LatLng>();
  const adj = new Map<string, Edge[]>();
  const link = (ka: string, kb: string, w: number) => {
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push({ to: kb, w });
    adj.get(kb)!.push({ to: ka, w });
  };
  const addEdge = (a: LatLng, b: LatLng) => {
    const ka = key(a.lat, a.lng);
    const kb = key(b.lat, b.lng);
    if (ka === kb) return;
    coord.set(ka, a);
    coord.set(kb, b);
    link(ka, kb, meters(a, b));
  };

  for (const el of json.elements ?? []) {
    const g = el.geometry;
    if (!g || g.length < 2) continue;
    for (let i = 1; i < g.length; i++) {
      addEdge(
        { lat: g[i - 1].lat, lng: g[i - 1].lon },
        { lat: g[i].lat, lng: g[i].lon },
      );
    }
  }

  // Bridge small gaps: OSM trail ways often nearly touch without sharing a node.
  // Spatial-hash the nodes into `snapMeters` cells and link any pair within that
  // distance, so a route can cross the gap. The neighbor-cell scan avoids the
  // grid-boundary misses of plain coordinate snapping.
  if (snapMeters > 0 && coord.size > 0) {
    const cell = snapMeters / 111_000;
    const buckets = new Map<string, string[]>();
    const bucketKey = (c: LatLng) =>
      `${Math.floor(c.lat / cell)},${Math.floor(c.lng / cell)}`;
    for (const [k, c] of coord) {
      const bk = bucketKey(c);
      if (!buckets.has(bk)) buckets.set(bk, []);
      buckets.get(bk)!.push(k);
    }
    for (const [k, c] of coord) {
      const ci = Math.floor(c.lat / cell);
      const cj = Math.floor(c.lng / cell);
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          for (const k2 of buckets.get(`${ci + di},${cj + dj}`) ?? []) {
            if (k2 <= k) continue;
            const d = meters(c, coord.get(k2)!);
            if (d > 0 && d <= snapMeters) link(k, k2, d);
          }
        }
      }
    }
  }

  return { coord, adj };
}

function nearestNode(coord: Map<string, LatLng>, pt: LatLng): string {
  let best = "";
  let bestD = Infinity;
  for (const [k, c] of coord) {
    const d = meters(pt, c);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}

/** Dijkstra over `adj` from `source` to `target`, skipping any `blocked` edges.
 *  Returns the node-key path (inclusive), or `[]` if unreachable. */
function dijkstra(
  graph: Graph,
  source: string,
  target: string,
  blocked?: Set<string>,
): string[] {
  if (source === target) return [source];
  const dist = new Map<string, number>([[source, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();

  while (true) {
    let u = "";
    let best = Infinity;
    for (const [k, d] of dist) {
      if (!done.has(k) && d < best) {
        best = d;
        u = k;
      }
    }
    if (u === "" || u === target) break;
    done.add(u);
    for (const { to, w } of graph.adj.get(u) ?? []) {
      if (done.has(to)) continue;
      if (blocked?.has(edgeKey(u, to))) continue;
      const nd = best + w;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, u);
      }
    }
  }

  if (!dist.has(target)) return [];
  const path: string[] = [];
  let cur: string | undefined = target;
  while (cur !== undefined) {
    path.unshift(cur);
    if (cur === source) break;
    cur = prev.get(cur);
  }
  return path[0] === source ? path : [];
}

/**
 * The on-network path from the node nearest `start` to the node nearest `end`.
 * Returns `[]` when the network is empty or the two endpoints are in
 * disconnected components.
 */
export function networkRoute(
  json: OverpassGeom,
  start: LatLng,
  end: LatLng,
  snapMeters = 0,
): LatLng[] {
  const graph = buildGraph(json, snapMeters);
  if (graph.coord.size === 0) return [];
  const s = nearestNode(graph.coord, start);
  const t = nearestNode(graph.coord, end);
  return dijkstra(graph, s, t).map((k) => graph.coord.get(k)!);
}

/**
 * A loop from the trailhead out to a `via` point and back a different way: the
 * shortest path out, then the shortest path back with the outbound edges
 * removed. Falls back to an out-and-back when no edge-disjoint return exists.
 * Returns `[]` when `via` is unreachable.
 */
export function networkLoop(
  json: OverpassGeom,
  start: LatLng,
  via: LatLng,
  snapMeters = 0,
): LatLng[] {
  const graph = buildGraph(json, snapMeters);
  if (graph.coord.size === 0) return [];
  const s = nearestNode(graph.coord, start);
  const v = nearestNode(graph.coord, via);

  const out = dijkstra(graph, s, v);
  if (out.length < 2) return out.map((k) => graph.coord.get(k)!);

  const blocked = new Set<string>();
  for (let i = 1; i < out.length; i++) blocked.add(edgeKey(out[i - 1], out[i]));

  const back = dijkstra(graph, v, s, blocked);
  const loopKeys =
    back.length >= 2
      ? [...out, ...back.slice(1)]
      : [...out, ...[...out].reverse().slice(1)];
  return loopKeys.map((k) => graph.coord.get(k)!);
}

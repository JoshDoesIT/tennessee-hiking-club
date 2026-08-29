/**
 * Web Mercator slippy-map tile math for the "download this area" feature
 * (#217, spec 0007). Pure and side-effect free: enumerate the {z}/{x}/{y} tiles
 * covering a bounding box so the caller can `fetch()` them through the service
 * worker, which caches them for offline use.
 */

export type LngLatBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type Tile = { z: number; x: number; y: number };

/**
 * Hard ceiling on tiles per region download. Keeps a careless zoom range (or a
 * fat-fingered bounding box) from trying to pull a continent. Picked so a
 * trailhead-sized area through the base map's max zoom stays well under it.
 */
export const MAX_TILES = 1500;

/** Latitude beyond which Web Mercator is undefined; clamp to the square world. */
const MAX_LAT = 85.0511287798066;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Tile column/row containing the given lng/lat at zoom `z` (clamped to grid). */
export function lngLatToTile(
  lng: number,
  lat: number,
  z: number,
): { x: number; y: number } {
  const zoom = Math.max(0, Math.floor(z));
  const n = 2 ** zoom;
  const lon = clamp(lng, -180, 180);
  const latC = clamp(lat, -MAX_LAT, MAX_LAT);
  const latRad = (latC * Math.PI) / 180;

  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x: clamp(x, 0, n - 1), y: clamp(y, 0, n - 1) };
}

/** Inclusive tile-index range covering `bounds` at zoom `z`. */
export function tileRangeForBounds(bounds: LngLatBounds, z: number) {
  const west = Math.min(bounds.west, bounds.east);
  const east = Math.max(bounds.west, bounds.east);
  const south = Math.min(bounds.south, bounds.north);
  const north = Math.max(bounds.south, bounds.north);

  // Tile-y grows southward, so the north edge gives the smaller y.
  const topLeft = lngLatToTile(west, north, z);
  const bottomRight = lngLatToTile(east, south, z);
  return {
    minX: Math.min(topLeft.x, bottomRight.x),
    maxX: Math.max(topLeft.x, bottomRight.x),
    minY: Math.min(topLeft.y, bottomRight.y),
    maxY: Math.max(topLeft.y, bottomRight.y),
  };
}

/** Number of tiles covering `bounds` from `minZoom` to `maxZoom` inclusive. */
export function countTiles(
  bounds: LngLatBounds,
  minZoom: number,
  maxZoom: number,
): number {
  let total = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    const r = tileRangeForBounds(bounds, z);
    total += (r.maxX - r.minX + 1) * (r.maxY - r.minY + 1);
  }
  return total;
}

/**
 * Every tile covering `bounds` across the inclusive zoom range. Throws a
 * `RangeError` if the region would exceed {@link MAX_TILES}; callers should
 * check {@link countTiles} first and surface a friendly message.
 */
export function enumerateTiles(
  bounds: LngLatBounds,
  minZoom: number,
  maxZoom: number,
): Tile[] {
  const total = countTiles(bounds, minZoom, maxZoom);
  if (total > MAX_TILES) {
    throw new RangeError(
      `Region too large: ${total} tiles exceeds the ${MAX_TILES} limit. Zoom in or narrow the zoom range.`,
    );
  }
  const tiles: Tile[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const r = tileRangeForBounds(bounds, z);
    for (let x = r.minX; x <= r.maxX; x++) {
      for (let y = r.minY; y <= r.maxY; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

/** Fill a `{z}/{x}/{y}` tile-URL template for one tile. */
export function expandTemplate(template: string, tile: Tile): string {
  return template
    .replace("{z}", String(tile.z))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y));
}

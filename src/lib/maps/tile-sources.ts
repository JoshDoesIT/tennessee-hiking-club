import type { TileSource } from "./download-region";

/**
 * The tile sources the detail map draws from (keep in sync with
 * `build-style.ts`). The vector base's tile URL carries a dated version
 * segment, so its template is resolved from the TileJSON at run time rather
 * than hard-coded; the elevation DEM template is stable.
 */

/** Public-domain AWS Terrarium elevation tiles (drives terrain + hillshade). */
export const TERRARIUM_DEM_TEMPLATE =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/** OpenFreeMap vector base TileJSON; its `tiles[0]` is the versioned template. */
export const PLANET_TILEJSON = "https://tiles.openfreemap.org/planet";

/** DEM raster tops out below the vector base (matches build-style). */
const DEM_MAXZOOM = 13;

/**
 * Resolve the tile sources to prefetch for a region: the live vector base
 * (first, so it is the primary download) plus the elevation DEM. If the
 * TileJSON cannot be read (e.g. already offline), fall back to the DEM alone so
 * a download still warms terrain tiles rather than failing outright.
 */
export async function resolveTileSources(
  fetchImpl: typeof fetch = fetch,
): Promise<TileSource[]> {
  const dem: TileSource = { template: TERRARIUM_DEM_TEMPLATE, maxzoom: DEM_MAXZOOM };
  try {
    const res = await fetchImpl(PLANET_TILEJSON);
    if (res.ok) {
      const tilejson = (await res.json()) as {
        tiles?: string[];
        minzoom?: number;
        maxzoom?: number;
      };
      const template = tilejson.tiles?.[0];
      if (template) {
        return [
          {
            template,
            minzoom: tilejson.minzoom ?? 0,
            maxzoom: tilejson.maxzoom ?? 14,
          },
          dem,
        ];
      }
    }
  } catch {
    // Offline or unreachable: warm terrain from the stable DEM template only.
  }
  return [dem];
}

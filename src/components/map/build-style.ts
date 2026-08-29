import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { TENNESSEE } from "@/lib/geo/tennessee";

/** Public-domain global elevation tiles (AWS Terrarium / Mapzen). */
const TERRARIUM_DEM =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/** Brand-kit palette used to repaint the OpenFreeMap base: Trail Cream land,
 * Mountain Teal water, Moss greenery, Evergreen labels (docs/brand/BRAND.md). */
const COLOR = {
  background: "#ede5c0",
  land: "#f2ecc9",
  water: "#a5c6ca",
  green: "#b3c893",
  boundary: "#96a38f",
  line: "#e0d8ae",
  text: "#151f0a",
  textHalo: "#f9f3d5",
  mask: "#f9f3d5",
  outline: "#151f0a",
  hillshadeShadow: "#2a331f",
} as const;

/**
 * Opacity of the cream wash over everything outside Tennessee. Below 1 so the
 * surrounding states stay visible (just dimmed), with Tennessee at full
 * strength so it clearly reads as the focus.
 */
const MASK_OPACITY = 0.72;

type MapLayer = {
  id: string;
  type: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  [key: string]: unknown;
};

export type MapStyle = {
  version: number;
  sources: Record<string, unknown>;
  layers: MapLayer[];
  terrain?: unknown;
  [key: string]: unknown;
};

/** Return a copy of `layer` with its paint nudged toward the brand palette. */
function recolor(layer: MapLayer): MapLayer {
  const paint = { ...(layer.paint ?? {}) };
  if (layer.type === "background") {
    paint["background-color"] = COLOR.background;
  } else if (layer.type === "fill") {
    if (/water|ocean|river|lake|bay/i.test(layer.id)) {
      paint["fill-color"] = COLOR.water;
    } else if (
      /wood|forest|park|grass|scrub|wetland|landcover|landuse|nature/i.test(
        layer.id,
      )
    ) {
      paint["fill-color"] = COLOR.green;
    } else {
      paint["fill-color"] = COLOR.land;
    }
  } else if (layer.type === "line") {
    if (/water|river|stream/i.test(layer.id)) {
      paint["line-color"] = COLOR.water;
    } else if (/boundary|admin/i.test(layer.id)) {
      paint["line-color"] = COLOR.boundary;
    } else {
      paint["line-color"] = COLOR.line;
    }
  } else if (
    layer.type === "symbol" &&
    layer.layout &&
    "text-field" in layer.layout
  ) {
    paint["text-color"] = COLOR.text;
    paint["text-halo-color"] = COLOR.textHalo;
  }
  return { ...layer, paint };
}

/** A world-covering polygon with Tennessee punched out as interior holes. */
function tennesseeMask(): Feature {
  const geom = TENNESSEE.geometry as Polygon | MultiPolygon;
  const tnRings: Position[][] =
    geom.type === "MultiPolygon"
      ? geom.coordinates.map((poly) => poly[0])
      : [geom.coordinates[0]];
  const worldRing: Position[] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [worldRing, ...tnRings] },
  };
}

/**
 * Transform the OpenFreeMap base style into the Tennessee Hiking Club look:
 * brand recolor, public-domain 3D terrain + shaded relief, and a translucent
 * cream wash that dims everything outside the state.
 *
 * Returns a brand-new style (the input is never mutated) so the map can be
 * created with it directly; the first frame already shows our palette,
 * terrain, and mask, with no flash of the default OpenFreeMap colors.
 */
export function buildTennesseeStyle(base: MapStyle): MapStyle {
  const recolored = base.layers.map(recolor);

  // MapLibre warns when the same source backs both `hillshade` and 3D
  // `terrain`. Use two distinct sources (pointing at the same Terrarium
  // tiles) so it can cache and rasterise each independently.
  const hillshade: MapLayer = {
    id: "hillshade",
    type: "hillshade",
    source: "hillshade-dem",
    paint: {
      "hillshade-exaggeration": 0.9,
      "hillshade-shadow-color": COLOR.hillshadeShadow,
    },
  };
  // Keep relief beneath the labels so place names stay legible.
  const firstSymbol = recolored.findIndex((l) => l.type === "symbol");
  const withRelief =
    firstSymbol === -1
      ? [...recolored, hillshade]
      : [
          ...recolored.slice(0, firstSymbol),
          hillshade,
          ...recolored.slice(firstSymbol),
        ];

  const maskLayer: MapLayer = {
    id: "tn-mask",
    type: "fill",
    source: "tn-mask",
    paint: { "fill-color": COLOR.mask, "fill-opacity": MASK_OPACITY },
  };
  const outlineLayer: MapLayer = {
    id: "tn-outline",
    type: "line",
    source: "tn-outline",
    paint: { "line-color": COLOR.outline, "line-width": 1.5 },
  };

  return {
    ...base,
    sources: {
      ...base.sources,
      "terrain-dem": {
        type: "raster-dem",
        tiles: [TERRARIUM_DEM],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 13,
        attribution:
          'Elevation: <a href="https://github.com/tilezen/joerd">Mapzen / AWS Terrain Tiles</a>',
      },
      "hillshade-dem": {
        type: "raster-dem",
        tiles: [TERRARIUM_DEM],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 13,
      },
      "tn-mask": { type: "geojson", data: tennesseeMask() },
      "tn-outline": { type: "geojson", data: TENNESSEE },
    },
    terrain: { source: "terrain-dem", exaggeration: 2.6 },
    layers: [...withRelief, maskLayer, outlineLayer],
  };
}

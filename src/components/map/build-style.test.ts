import { describe, it, expect } from "vitest";
import { buildTennesseeStyle, type MapStyle } from "./build-style";
import { TENNESSEE } from "@/lib/geo/tennessee";

// A trimmed stand-in for the OpenFreeMap "liberty" style: one of each layer
// kind we recolor, plus an icon-only symbol layer (no text-field).
const base = (): MapStyle => ({
  version: 8,
  sources: { openmaptiles: { type: "vector", url: "https://example/x.json" } },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#ffffff" },
    },
    { id: "water", type: "fill", paint: { "fill-color": "#aad3df" } },
    { id: "landcover-wood", type: "fill", paint: { "fill-color": "#cdeccd" } },
    { id: "building", type: "fill", paint: { "fill-color": "#dddddd" } },
    { id: "waterway", type: "line", paint: { "line-color": "#aad3df" } },
    { id: "boundary-admin", type: "line", paint: { "line-color": "#888888" } },
    { id: "road", type: "line", paint: { "line-color": "#ffffff" } },
    {
      id: "place-label",
      type: "symbol",
      layout: { "text-field": "{name}" },
      paint: {},
    },
    { id: "poi-icon", type: "symbol", layout: {}, paint: {} },
  ],
});

const byId = (style: MapStyle, id: string) =>
  style.layers.find((l) => l.id === id);

describe("buildTennesseeStyle", () => {
  it("recolors fills by category (water, green, land)", () => {
    const s = buildTennesseeStyle(base());
    expect(byId(s, "water")?.paint?.["fill-color"]).toBe("#b6c8c0");
    expect(byId(s, "landcover-wood")?.paint?.["fill-color"]).toBe("#bcc391");
    expect(byId(s, "building")?.paint?.["fill-color"]).toBe("#efe6d2");
  });

  it("recolors lines by category (water, boundary, other)", () => {
    const s = buildTennesseeStyle(base());
    expect(byId(s, "waterway")?.paint?.["line-color"]).toBe("#b6c8c0");
    expect(byId(s, "boundary-admin")?.paint?.["line-color"]).toBe("#b8ad8e");
    expect(byId(s, "road")?.paint?.["line-color"]).toBe("#dccfb2");
  });

  it("recolors the background and label text in brand tones", () => {
    const s = buildTennesseeStyle(base());
    expect(byId(s, "background")?.paint?.["background-color"]).toBe("#f1e9d6");
    const label = byId(s, "place-label");
    expect(label?.paint?.["text-color"]).toBe("#2a3623");
    expect(label?.paint?.["text-halo-color"]).toBe("#fbf6e9");
  });

  it("leaves icon-only symbol layers without a text color", () => {
    const s = buildTennesseeStyle(base());
    expect(byId(s, "poi-icon")?.paint?.["text-color"]).toBeUndefined();
  });

  it("adds a public-domain elevation source and enables 3D terrain", () => {
    const s = buildTennesseeStyle(base());
    expect(s.sources["terrain-dem"]).toMatchObject({
      type: "raster-dem",
      encoding: "terrarium",
    });
    expect(s.terrain).toMatchObject({
      source: "terrain-dem",
      exaggeration: 2.6,
    });
  });

  it("inserts shaded relief below the first label layer", () => {
    const ids = buildTennesseeStyle(base()).layers.map((l) => l.id);
    expect(ids).toContain("hillshade");
    expect(ids.indexOf("hillshade")).toBeLessThan(ids.indexOf("place-label"));
  });

  it("masks outside Tennessee and outlines the state on top", () => {
    const s = buildTennesseeStyle(base());
    const ids = s.layers.map((l) => l.id);
    // Mask then outline sit at the very top of the stack.
    expect(ids.slice(-2)).toEqual(["tn-mask", "tn-outline"]);

    const mask = s.sources["tn-mask"] as {
      data: { geometry: { coordinates: Position[][] } };
    };
    // First ring is the whole world; Tennessee is punched out as a hole.
    expect(mask.data.geometry.coordinates[0]).toEqual([
      [-180, -85],
      [180, -85],
      [180, 85],
      [-180, 85],
      [-180, -85],
    ]);
    expect(mask.data.geometry.coordinates.length).toBeGreaterThan(1);

    expect((s.sources["tn-outline"] as { data: unknown }).data).toBe(TENNESSEE);
  });

  it("dims, but does not hide, the area outside Tennessee", () => {
    const opacity = byId(buildTennesseeStyle(base()), "tn-mask")?.paint?.[
      "fill-opacity"
    ] as number;
    // A translucent cream wash: neighbours stay visible, Tennessee stands out.
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it("does not mutate the input style", () => {
    const input = base();
    const snapshot = structuredClone(input);
    buildTennesseeStyle(input);
    expect(input).toEqual(snapshot);
  });

  it("uses separate sources for hillshade and 3D terrain (MapLibre render-quality recommendation)", () => {
    const s = buildTennesseeStyle(base());
    const hillshadeLayer = byId(s, "hillshade");

    expect(hillshadeLayer?.source).not.toBe("terrain-dem");
    expect(s.sources["hillshade-dem"]).toBeDefined();
    expect(s.sources["terrain-dem"]).toBeDefined();

    // Both sources point at the same Terrarium tiles, just under different ids.
    const hill = s.sources["hillshade-dem"] as { type: string; tiles: string[] };
    const terrain = s.sources["terrain-dem"] as { type: string; tiles: string[] };
    expect(hill.type).toBe("raster-dem");
    expect(terrain.type).toBe("raster-dem");
  });
});

type Position = [number, number];

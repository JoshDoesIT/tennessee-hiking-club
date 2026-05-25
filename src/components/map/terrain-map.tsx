"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { TENNESSEE } from "@/lib/geo/tennessee";

export type TrailPin = {
  slug: string;
  name: string;
  region: string;
  coordinates: { lat: number; lng: number };
};

/** Roughly the center of Tennessee. */
const TN_CENTER: [number, number] = [-86.6, 35.86];
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const TERRARIUM_DEM =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/**
 * Interactive 3D terrain map of Tennessee (MapLibre GL). Uses open, key-free
 * data: OpenFreeMap vector tiles + public-domain AWS Terrarium elevation.
 * Client-only (WebGL); the trail list on /explore is the accessible fallback.
 *
 * Note: the map container needs an explicit height — MapLibre's stylesheet sets
 * `position: relative` on it, which would cancel an `inset-0`-based size.
 */
export function TerrainMap({ trails }: { trails: TrailPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style: OPENFREEMAP_STYLE,
          center: TN_CENTER,
          zoom: 6.1,
          pitch: 55,
          bearing: -14,
          maxPitch: 80,
          cooperativeGestures: true,
          canvasContextAttributes: { preserveDrawingBuffer: true },
        });

        map.addControl(
          new maplibregl.NavigationControl({ visualizePitch: true }),
          "top-right",
        );
        map.addControl(new maplibregl.FullscreenControl(), "top-right");
        map.on("error", () => {
          /* ignore transient tile errors */
        });

        map.on("load", () => {
          if (!map || cancelled) return;
          map.resize();

          // Recolor the OpenFreeMap base toward the vintage brand palette.
          for (const layer of map.getStyle().layers ?? []) {
            try {
              if (layer.type === "background") {
                map.setPaintProperty(layer.id, "background-color", "#f1e9d6");
              } else if (layer.type === "fill") {
                if (/water|ocean|river|lake|bay/i.test(layer.id)) {
                  map.setPaintProperty(layer.id, "fill-color", "#b6c8c0");
                } else if (
                  /wood|forest|park|grass|scrub|wetland|landcover|landuse|nature/i.test(
                    layer.id,
                  )
                ) {
                  map.setPaintProperty(layer.id, "fill-color", "#bcc391");
                } else {
                  map.setPaintProperty(layer.id, "fill-color", "#efe6d2");
                }
              } else if (layer.type === "line") {
                if (/water|river|stream/i.test(layer.id)) {
                  map.setPaintProperty(layer.id, "line-color", "#b6c8c0");
                } else if (/boundary|admin/i.test(layer.id)) {
                  map.setPaintProperty(layer.id, "line-color", "#b8ad8e");
                } else {
                  map.setPaintProperty(layer.id, "line-color", "#dccfb2");
                }
              } else if (
                layer.type === "symbol" &&
                layer.layout &&
                "text-field" in layer.layout
              ) {
                map.setPaintProperty(layer.id, "text-color", "#2a3623");
                map.setPaintProperty(layer.id, "text-halo-color", "#fbf6e9");
              }
            } catch {
              /* layer doesn't support this paint property */
            }
          }

          map.addSource("terrain-dem", {
            type: "raster-dem",
            tiles: [TERRARIUM_DEM],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 13,
            attribution:
              'Elevation: <a href="https://github.com/tilezen/joerd">Mapzen / AWS Terrain Tiles</a>',
          });
          map.setTerrain({ source: "terrain-dem", exaggeration: 2.6 });

          // Shaded relief so the terrain reads even from above.
          const firstSymbol = map
            .getStyle()
            .layers?.find((l) => l.type === "symbol")?.id;
          map.addLayer(
            {
              id: "hillshade",
              type: "hillshade",
              source: "terrain-dem",
              paint: {
                "hillshade-exaggeration": 0.9,
                "hillshade-shadow-color": "#3d3422",
              },
            },
            firstSymbol,
          );

          // Mask everything outside Tennessee with the page's cream.
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
          const maskData = {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [worldRing, ...tnRings] },
          } as Feature;
          map.addSource("tn-mask", { type: "geojson", data: maskData });
          map.addLayer({
            id: "tn-mask",
            type: "fill",
            source: "tn-mask",
            paint: { "fill-color": "#fbf6e9", "fill-opacity": 1 },
          });

          // Crisp Tennessee outline on top.
          map.addSource("tn-outline", { type: "geojson", data: TENNESSEE });
          map.addLayer({
            id: "tn-outline",
            type: "line",
            source: "tn-outline",
            paint: { "line-color": "#2a3623", "line-width": 1.5 },
          });

          for (const trail of trails) {
            const el = document.createElement("button");
            el.type = "button";
            el.setAttribute(
              "aria-label",
              `${trail.name} — ${trail.region} Tennessee`,
            );
            Object.assign(el.style, {
              width: "16px",
              height: "16px",
              borderRadius: "9999px",
              background: "#e0a24c",
              border: "2.5px solid #2a3623",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,.35)",
            });

            const content = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = trail.name;
            const region = document.createElement("div");
            region.textContent = `${trail.region} Tennessee`;
            Object.assign(region.style, {
              fontSize: "12px",
              color: "#5c6d4a",
              marginTop: "2px",
            });
            const link = document.createElement("a");
            link.href = `/trails/${trail.slug}`;
            link.textContent = "View trail →";
            Object.assign(link.style, {
              display: "inline-block",
              marginTop: "6px",
              color: "#2a3623",
              fontWeight: "600",
            });
            content.append(title, region, link);

            const popup = new maplibregl.Popup({
              offset: 16,
              closeButton: true,
            }).setDOMContent(content);

            new maplibregl.Marker({ element: el })
              .setLngLat([trail.coordinates.lng, trail.coordinates.lat])
              .setPopup(popup)
              .addTo(map);
          }

          if (!cancelled) setReady(true);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [trails]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        role="application"
        aria-label="Interactive 3D terrain map of Tennessee"
        className="bg-sage-100/30 border-forest/15 h-[70vh] min-h-[420px] w-full overflow-hidden rounded-2xl border"
      />
      {!ready ? (
        <div className="text-olive pointer-events-none absolute inset-0 grid place-items-center text-sm">
          {failed
            ? "The 3D map couldn’t load — use the trail list below."
            : "Loading the 3D terrain map…"}
        </div>
      ) : null}
    </div>
  );
}

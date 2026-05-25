"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

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
          pitch: 62,
          bearing: -14,
          maxPitch: 80,
          cooperativeGestures: true,
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

          map.addSource("terrain-dem", {
            type: "raster-dem",
            tiles: [TERRARIUM_DEM],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 13,
            attribution:
              'Elevation: <a href="https://github.com/tilezen/joerd">Mapzen / AWS Terrain Tiles</a>',
          });
          map.setTerrain({ source: "terrain-dem", exaggeration: 1.6 });

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
    <div
      role="application"
      aria-label="Interactive 3D terrain map of Tennessee"
      className="bg-sage-100/30 border-forest/15 relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-2xl border"
    >
      <div ref={containerRef} className="absolute inset-0" />
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

"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import { buildTennesseeStyle, type MapStyle } from "./build-style";
import { TENNESSEE_BOUNDS } from "@/lib/maps";

export type TrailPin = {
  slug: string;
  name: string;
  region: string;
  coordinates: { lat: number; lng: number };
};

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/** South-west and north-east corners of Tennessee, for the opening fit. */
const TN_BOUNDS: [[number, number], [number, number]] = [
  [TENNESSEE_BOUNDS.lngMin, TENNESSEE_BOUNDS.latMin],
  [TENNESSEE_BOUNDS.lngMax, TENNESSEE_BOUNDS.latMax],
];

/**
 * Interactive 3D terrain map of Tennessee (MapLibre GL). Uses open, key-free
 * data: OpenFreeMap vector tiles + public-domain AWS Terrarium elevation.
 * Client-only (WebGL); the trail list on /explore is the accessible fallback.
 *
 * The OpenFreeMap style is fetched and rebranded *before* the map is created
 * (see build-style), so the very first frame already shows our palette,
 * terrain, and the cream wash over neighbouring states — no flash of the
 * default map. The camera opens on the whole state, level and north-up; users
 * can tilt up to 80° with the navigation control for the 3D view.
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
        // Load the library and base style in parallel, then rebrand the style
        // before first paint so the map never flashes its default colors.
        const [maplibregl, baseStyle] = await Promise.all([
          import("maplibre-gl").then((m) => m.default),
          fetch(OPENFREEMAP_STYLE).then(async (r) => {
            if (!r.ok) throw new Error(`Map style request failed: ${r.status}`);
            return (await r.json()) as MapStyle;
          }),
        ]);
        if (cancelled || !containerRef.current) return;

        const style = buildTennesseeStyle(
          baseStyle,
        ) as unknown as StyleSpecification;

        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          bounds: TN_BOUNDS,
          fitBoundsOptions: { padding: 24 },
          pitch: 0,
          bearing: 0,
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
        className="bg-parchment border-forest/15 h-[70vh] min-h-[420px] w-full overflow-hidden rounded-2xl border"
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

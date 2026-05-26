"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import { buildTennesseeStyle, type MapStyle } from "./build-style";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * Small context map of a single trailhead (MapLibre GL + OpenFreeMap, no API
 * key). Reuses the site's branded style so it matches the Explore map and
 * never flashes the default colors. Client-only; the trail's coordinates and
 * the "Open in Google Maps" button are the accessible, no-WebGL fallback.
 */
export function TrailContextMap({
  coordinates,
  name,
}: {
  coordinates: { lat: number; lng: number };
  name: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    const center: [number, number] = [coordinates.lng, coordinates.lat];

    (async () => {
      try {
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
          center,
          zoom: 11,
          pitch: 0,
          maxPitch: 70,
          cooperativeGestures: true,
          canvasContextAttributes: { preserveDrawingBuffer: true },
        });

        map.addControl(
          new maplibregl.NavigationControl({ visualizePitch: true }),
          "top-right",
        );
        map.on("error", () => {
          /* ignore transient tile errors */
        });

        map.on("load", () => {
          if (!map || cancelled) return;
          map.resize();

          const el = document.createElement("div");
          el.setAttribute("aria-hidden", "true");
          Object.assign(el.style, {
            width: "16px",
            height: "16px",
            borderRadius: "9999px",
            background: "#e0a24c",
            border: "2.5px solid #2a3623",
            boxShadow: "0 1px 4px rgba(0,0,0,.35)",
          });
          new maplibregl.Marker({ element: el }).setLngLat(center).addTo(map);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [coordinates.lat, coordinates.lng]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        role="application"
        aria-label={`Map of the ${name} trailhead`}
        className="bg-parchment border-forest/15 h-72 w-full overflow-hidden rounded-2xl border"
      />
      {failed ? (
        <div className="text-olive pointer-events-none absolute inset-0 grid place-items-center text-sm">
          Map unavailable. Use Open in Google Maps below.
        </div>
      ) : null}
    </div>
  );
}

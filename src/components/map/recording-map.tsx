"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import { buildTennesseeStyle, type MapStyle } from "./build-style";
import { routeLineFeature } from "@/lib/maps/route-line";
import { currentPosition } from "@/lib/maps/recording-map";
import type { RoutePoint } from "@/lib/trails/elevation";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const EMPTY_TRACK: GeoJSON.Feature = {
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates: [] },
};

/**
 * A live, GPS-style map for the recording view (#271): the trail's planned
 * route, the track recorded so far, and a "you are here" marker that follows
 * the device and keeps the map centered as new fixes arrive. The track and
 * position come from the app-wide recording store, so this just renders them;
 * the trail coordinates are the accessible, no-WebGL fallback center.
 */
export function RecordingMap({
  center,
  route,
  points,
  trailName,
}: {
  center: { lat: number; lng: number };
  route?: { lat: number; lng: number }[];
  points: RoutePoint[];
  trailName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const loadedRef = useRef(false);
  const pointsRef = useRef(points);
  const [failed, setFailed] = useState(false);

  // Keep the latest fixes reachable from the build-once effect's async `load`
  // callback without making the map rebuild on every fix.
  useEffect(() => {
    pointsRef.current = points;
  });

  const routeKey = JSON.stringify(route ?? []);
  const last = points[points.length - 1];
  const positionKey = `${points.length}:${last?.lat ?? ""},${last?.lng ?? ""}`;

  // Build the map once. Reading the latest fix from a ref keeps the heavy WebGL
  // setup out of the per-fix update path (the follow effect below handles that).
  useEffect(() => {
    let cancelled = false;
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
        const startRoute = routeKey ? (JSON.parse(routeKey) as typeof route) : [];

        const map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: currentPosition(pointsRef.current, center),
          zoom: 14,
          pitch: 0,
          maxPitch: 0,
          cooperativeGestures: true,
          canvasContextAttributes: { preserveDrawingBuffer: true },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl(), "top-right");
        map.on("error", () => {
          /* ignore transient tile errors */
        });

        map.on("load", () => {
          if (cancelled) return;
          map.resize();

          // The planned trail route, faint beneath the recorded track.
          const routeFeature = routeLineFeature(startRoute);
          if (routeFeature) {
            map.addSource("trail-route", {
              type: "geojson",
              data: routeFeature as unknown as GeoJSON.Feature,
            });
            map.addLayer({
              id: "trail-route-line",
              type: "line",
              source: "trail-route",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#6c724a",
                "line-width": 3,
                "line-opacity": 0.6,
                "line-dasharray": [2, 1.5],
              },
            });
          }

          // The track recorded so far: the bold "where you've walked" line.
          map.addSource("recorded-track", {
            type: "geojson",
            data: (routeLineFeature(pointsRef.current) ??
              EMPTY_TRACK) as unknown as GeoJSON.Feature,
          });
          map.addLayer({
            id: "recorded-track-casing",
            type: "line",
            source: "recorded-track",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#2a3623", "line-width": 6 },
          });
          map.addLayer({
            id: "recorded-track-line",
            type: "line",
            source: "recorded-track",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#e0a24c", "line-width": 3.5 },
          });

          // The "you are here" marker.
          const el = document.createElement("div");
          el.className = "recording-position";
          el.setAttribute("aria-hidden", "true");
          markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(currentPosition(pointsRef.current, center))
            .addTo(map);

          loadedRef.current = true;
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      loadedRef.current = false;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Rebuilds only if the planned route changes; live fixes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // Follow the device: on each new fix, extend the recorded track, move the
  // marker, and recenter so the current position stays in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const track = (routeLineFeature(points) ??
      EMPTY_TRACK) as unknown as GeoJSON.Feature;
    (map.getSource("recorded-track") as GeoJSONSource | undefined)?.setData(
      track,
    );
    const pos = currentPosition(points, center);
    markerRef.current?.setLngLat(pos);
    map.easeTo({ center: pos, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionKey]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Your position while recording${trailName ? ` ${trailName}` : ""}`}
      className="border-forest/10 mt-3 h-64 w-full overflow-hidden rounded-xl border sm:h-80"
    >
      {failed ? (
        <p className="text-ink/70 p-4 text-sm">
          The live map isn’t available on this device. Your hike is still
          recording.
        </p>
      ) : null}
    </div>
  );
}

"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import { buildTennesseeStyle, type MapStyle } from "./build-style";
import { routeLineFeature } from "@/lib/maps/route-line";
import {
  currentPosition,
  travelHeading,
  boundsOf,
} from "@/lib/maps/recording-map";
import type { RoutePoint } from "@/lib/trails/elevation";
import { Capacitor } from "@capacitor/core";
import {
  offlineTilesActive,
  makeTileTransformRequest,
  installOfflineTileProtocol,
} from "@/lib/maps/offline-tiles";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type LngLat = { lat: number; lng: number };
type CameraMode = "overview" | "follow";

const EMPTY_TRACK: GeoJSON.Feature = {
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates: [] },
};

/**
 * Point the camera per mode: "follow" zooms in and turns course-up toward the
 * direction of travel (the immersive GPS view); "overview" frames the whole
 * planned route plus the position, north-up, so you can see where you are along
 * the trail. Used on load, on a mode switch, and (for follow) on each fix.
 */
function frameMap(
  map: import("maplibre-gl").Map,
  mode: CameraMode,
  points: RoutePoint[],
  route: LngLat[] | undefined,
  center: LngLat,
  animate: boolean,
): void {
  const duration = animate ? 600 : 0;
  if (mode === "follow") {
    const pos = currentPosition(points, center);
    const heading = travelHeading(points);
    map.easeTo({
      center: pos,
      zoom: 15,
      duration,
      ...(heading != null ? { bearing: heading } : {}),
    });
    return;
  }
  const bounds = boundsOf([...(route ?? []), ...points, center]);
  if (bounds) {
    map.fitBounds(bounds, {
      padding: 48,
      maxZoom: 16,
      bearing: 0,
      pitch: 0,
      duration,
    });
  }
}

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
  // Default to follow: the immersive course-up GPS view. "Overview" switches to
  // the whole-route-with-your-position framing.
  const [mode, setMode] = useState<CameraMode>("follow");
  const modeRef = useRef(mode);

  // Keep the latest fixes and mode reachable from the build-once effect's async
  // `load` callback without making the map rebuild on every fix.
  useEffect(() => {
    pointsRef.current = points;
  });
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

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

        // Native + loaded from the local bundle: route tiles through the
        // on-device cache instead of the (now absent) service worker (#314).
        const useOfflineTiles = offlineTilesActive(
          Capacitor.isNativePlatform(),
          window.location.origin,
        );
        if (useOfflineTiles) installOfflineTileProtocol(maplibregl);

        const map = new maplibregl.Map({
          container: containerRef.current,
          style,
          transformRequest: makeTileTransformRequest(useOfflineTiles),
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

          // The planned trail route, drawn clearly beneath the recorded track
          // so you can see the whole trail and your progress along it.
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
                "line-color": "#475036",
                "line-width": 4,
                "line-opacity": 0.9,
                "line-dasharray": [1.5, 1.2],
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

          // The "you are here" heading puck: a forest dot with a cream ring, a
          // pulsing accuracy halo, and an amber heading cone. The map is kept
          // course-up (rotated to the heading below), so the cone, fixed to the
          // screen, always points the direction of travel.
          const el = document.createElement("div");
          el.className = "recording-puck";
          el.setAttribute("aria-hidden", "true");
          el.innerHTML = `
            <svg viewBox="0 0 64 64" width="64" height="64">
              <circle class="recording-puck-halo" cx="32" cy="32" r="13" />
              <path class="recording-puck-cone" d="M32 32 L16 6 A30 30 0 0 1 48 6 Z" />
              <circle class="recording-puck-dot" cx="32" cy="32" r="8" />
            </svg>`;
          markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(currentPosition(pointsRef.current, center))
            .addTo(map);

          loadedRef.current = true;
          // Initial framing: overview shows the whole route + position.
          frameMap(map, modeRef.current, pointsRef.current, startRoute, center, false);
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

  // On each new fix: extend the recorded track and move the marker. In follow
  // mode also recenter course-up; overview keeps the whole route framed.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const track = (routeLineFeature(points) ??
      EMPTY_TRACK) as unknown as GeoJSON.Feature;
    (map.getSource("recorded-track") as GeoJSONSource | undefined)?.setData(
      track,
    );
    markerRef.current?.setLngLat(currentPosition(points, center));
    if (modeRef.current === "follow") {
      frameMap(map, "follow", points, route, center, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionKey]);

  // Re-frame the camera when the member switches between overview and follow.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    frameMap(map, mode, points, route, center, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="relative mt-3">
      <div
        ref={containerRef}
        role="img"
        aria-label={`Your position while recording${trailName ? ` ${trailName}` : ""}`}
        className="border-forest/10 h-64 w-full overflow-hidden rounded-xl border sm:h-80"
      >
        {failed ? (
          <p className="text-ink/70 p-4 text-sm">
            The live map isn’t available on this device. Your hike is still
            recording.
          </p>
        ) : null}
      </div>
      {!failed ? (
        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === "overview" ? "follow" : "overview"))
          }
          aria-label={
            mode === "overview"
              ? "Follow my position on the map"
              : "Show the whole route on the map"
          }
          className="text-forest border-forest/15 bg-cream-50/90 absolute top-2 left-2 z-10 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur"
        >
          {mode === "overview" ? "Follow" : "Overview"}
        </button>
      ) : null}
    </div>
  );
}

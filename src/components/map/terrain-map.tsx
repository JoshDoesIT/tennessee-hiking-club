"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import { buildTennesseeStyle, type MapStyle } from "./build-style";
import { TENNESSEE_BOUNDS } from "@/lib/maps";
import { ALERT_LABEL } from "@/lib/trails/conditions";
import type { TrailAlert } from "@/lib/trails/schema";
import { routeLinesCollection } from "@/lib/maps/route-line";
import { recordLocationOptIn, resolveUserDot } from "@/lib/maps/location-pref";
import { Capacitor } from "@capacitor/core";
import {
  offlineTilesActive,
  makeTileTransformRequest,
  installOfflineTileProtocol,
} from "@/lib/maps/offline-tiles";

export type TrailPin = {
  slug: string;
  name: string;
  region: string;
  coordinates: { lat: number; lng: number };
  /** The trail's route geometry, drawn as its shape on the map (#270). */
  route?: { lat: number; lng: number }[];
  /** Most severe active alert level, if any (drives a distinct pin). */
  alert?: TrailAlert["level"];
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
 * terrain, and the cream wash over neighbouring states; no flash of the
 * default map. The camera opens on the whole state, level and north-up; users
 * can tilt up to 80° with the navigation control for the 3D view.
 *
 * Note: the map container needs an explicit height; MapLibre's stylesheet sets
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

        // Native + loaded from the local bundle: route tiles through the
        // on-device cache instead of the (now absent) service worker (#314).
        const useOfflineTiles = offlineTilesActive(
          Capacitor.isNativePlatform(),
          window.location.origin,
        );
        if (useOfflineTiles) installOfflineTileProtocol(maplibregl);

        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          transformRequest: makeTileTransformRequest(useOfflineTiles),
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
        // Opt-in "where am I": shows and tracks the member's position once they
        // tap the control and allow location (#271).
        const geolocate = new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
        });
        map.addControl(geolocate, "top-right");
        map.on("error", () => {
          /* ignore transient tile errors */
        });

        map.on("load", () => {
          if (!map || cancelled) return;
          map.resize();
          // Record the location opt-in for the passive dot below; never
          // auto-trigger, which would zoom the state map to the member (#285).
          recordLocationOptIn(geolocate);

          // Passive "you are here" dot if they have shared before, the whole
          // state stays framed; we never zoom to the member's location (#285).
          void resolveUserDot({}).then((dot) => {
            if (!dot || cancelled || !map) return;
            const uEl = document.createElement("div");
            uEl.setAttribute("aria-hidden", "true");
            Object.assign(uEl.style, {
              width: "16px",
              height: "16px",
              borderRadius: "9999px",
              background: "#1d6fe0",
              border: "3px solid #ffffff",
              boxShadow: "0 1px 4px rgba(0,0,0,.4)",
            });
            new maplibregl.Marker({ element: uEl })
              .setLngLat([dot.lng, dot.lat])
              .addTo(map);
          });

          // Draw every trail's shape as a faint amber line beneath the pins, so
          // the state map conveys the routes, not only their locations (#270).
          const routes = routeLinesCollection(trails);
          if (routes.features.length) {
            map.addSource("trail-routes", {
              type: "geojson",
              data: routes as unknown as GeoJSON.FeatureCollection,
            });
            map.addLayer({
              id: "trail-routes-line",
              type: "line",
              source: "trail-routes",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#e0a24c",
                "line-width": 2.5,
                "line-opacity": 0.75,
              },
            });
          }

          for (const trail of trails) {
            const lngLat: [number, number] = [
              trail.coordinates.lng,
              trail.coordinates.lat,
            ];

            // Each pin is a real link: focusable, and Enter or click opens the
            // trail page. The global :focus-visible ring makes the focused pin
            // obvious. (The trail list below is the always-available,
            // no-WebGL keyboard/screen-reader fallback.)
            const alertLabel = trail.alert ? ALERT_LABEL[trail.alert] : null;
            const el = document.createElement("a");
            el.href = `/trails/${trail.slug}`;
            el.setAttribute(
              "aria-label",
              `${trail.name}, ${trail.region} Tennessee${
                alertLabel ? `. ${alertLabel}.` : ""
              }`,
            );
            // Closures and cautions get a darker amber pin so they stand out;
            // the popup and aria-label carry the word, so it is never colour
            // alone.
            const background =
              trail.alert === "closure"
                ? "#8a5a1c"
                : trail.alert === "caution"
                  ? "#c8852f"
                  : "#e0a24c";
            Object.assign(el.style, {
              display: "block",
              width: "16px",
              height: "16px",
              borderRadius: "9999px",
              background,
              border: "2.5px solid #2a3623",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,.35)",
            });

            // Name + region preview, shown on hover or keyboard focus.
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
            content.append(title, region);
            if (alertLabel) {
              const alertEl = document.createElement("div");
              alertEl.textContent = alertLabel;
              Object.assign(alertEl.style, {
                fontSize: "12px",
                fontWeight: "600",
                color: "#8a5a1c",
                marginTop: "2px",
              });
              content.append(alertEl);
            }

            const popup = new maplibregl.Popup({
              offset: 16,
              closeButton: false,
              closeOnClick: false,
            })
              .setLngLat(lngLat)
              .setDOMContent(content);

            const showPreview = () => {
              if (map) popup.addTo(map);
            };
            const hidePreview = () => popup.remove();
            el.addEventListener("mouseenter", showPreview);
            el.addEventListener("mouseleave", hidePreview);
            el.addEventListener("focus", showPreview);
            el.addEventListener("blur", hidePreview);

            new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
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
        <div className="text-pine pointer-events-none absolute inset-0 grid place-items-center text-sm">
          {failed
            ? "The 3D map couldn’t load. Use the trail list below."
            : "Loading the 3D terrain map…"}
        </div>
      ) : null}
    </div>
  );
}

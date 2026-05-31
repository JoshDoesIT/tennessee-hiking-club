import type { WaypointType } from "@/lib/trails/schema";

/** Human label per waypoint type (#189), shared by the list and the map markers. */
export const WAYPOINT_LABEL: Record<WaypointType, string> = {
  waterfall: "Waterfall",
  viewpoint: "Viewpoint",
  summit: "Summit",
  gap: "Gap",
  water: "Water",
  campsite: "Campsite",
  arch: "Arch",
  parking: "Parking",
  caution: "Caution",
  landmark: "Landmark",
};

/** Marker / dot color per type. */
export const WAYPOINT_COLOR: Record<WaypointType, string> = {
  waterfall: "#3b82c4",
  viewpoint: "#e0a24c",
  summit: "#6c724a",
  gap: "#959760",
  water: "#3b82c4",
  campsite: "#8a5a1c",
  arch: "#9a6b3a",
  parking: "#475036",
  caution: "#c0392b",
  landmark: "#e0a24c",
};

/**
 * Build the DOM element for a waypoint's map marker (#189). Extracted so the
 * map styling/accessibility is unit-testable without WebGL: each marker is a
 * focusable, labeled dot colored by type, so keyboard and screen-reader users
 * get the same "what's along this trail" information as the visual map.
 */
export function createWaypointMarkerEl(w: {
  name: string;
  type: WaypointType;
}): HTMLDivElement {
  const el = document.createElement("div");
  const label = `${w.name}, ${WAYPOINT_LABEL[w.type]}`;
  el.setAttribute("role", "img");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", label);
  el.title = label;
  Object.assign(el.style, {
    width: "13px",
    height: "13px",
    borderRadius: "9999px",
    backgroundColor: WAYPOINT_COLOR[w.type],
    border: "2px solid #fbf6e9",
    boxShadow: "0 1px 4px rgba(0,0,0,.35)",
    cursor: "pointer",
  });
  return el;
}

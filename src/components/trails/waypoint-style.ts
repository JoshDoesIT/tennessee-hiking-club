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

/** Marker / dot color per type, drawn from the brand-kit palette: Mountain
 * Teal for water features, moss steps for lookouts, Rock Olive/Ridge Sage for
 * terrain. Caution keeps a functional red (safety semantics beat the palette). */
export const WAYPOINT_COLOR: Record<WaypointType, string> = {
  waterfall: "#375e62",
  viewpoint: "#8ca65e",
  summit: "#66867f",
  gap: "#94a88d",
  water: "#375e62",
  campsite: "#556b2f",
  arch: "#857a50",
  parking: "#465139",
  caution: "#c0392b",
  landmark: "#8ca65e",
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
    border: "2px solid #f9f3d5",
    boxShadow: "0 1px 4px rgba(0,0,0,.35)",
    cursor: "pointer",
  });
  return el;
}

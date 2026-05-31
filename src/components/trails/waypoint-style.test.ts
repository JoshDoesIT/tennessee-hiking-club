import { describe, it, expect } from "vitest";
import { createWaypointMarkerEl } from "./waypoint-style";

describe("createWaypointMarkerEl", () => {
  it("builds a keyboard-accessible, labeled marker for a waypoint", () => {
    const el = createWaypointMarkerEl({
      name: "Rainbow Falls",
      type: "waterfall",
    });
    // Keyboard-accessible with a label (AC: typed markers, keyboard-accessible).
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("tabindex")).toBe("0");
    expect(el.getAttribute("aria-label")).toBe("Rainbow Falls, Waterfall");
    expect(el.title).toBe("Rainbow Falls, Waterfall");
    // Colored by type so the marker is visually typed.
    expect(el.style.backgroundColor).toBeTruthy();
    // Not hidden from assistive tech.
    expect(el.getAttribute("aria-hidden")).toBeNull();
  });
});

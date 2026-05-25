import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// WebGL can't run in jsdom, so we mock maplibre-gl and assert our wiring.
// Constructors must be `function` (not arrows) to be usable with `new`.
const mocks = vi.hoisted(() => {
  const setTerrain = vi.fn();
  const on = vi.fn((evt: string, cb: () => void) => {
    if (evt === "load") cb();
  });
  const Map = vi.fn(function () {
    return {
      addControl: vi.fn(),
      on,
      addSource: vi.fn(),
      setTerrain,
      remove: vi.fn(),
    };
  });
  const Marker = vi.fn(function () {
    return {
      setLngLat: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    };
  });
  const Popup = vi.fn(function () {
    return { setDOMContent: vi.fn().mockReturnThis() };
  });
  return { Map, Marker, Popup, setTerrain };
});

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("maplibre-gl", () => ({
  default: {
    Map: mocks.Map,
    Marker: mocks.Marker,
    Popup: mocks.Popup,
    NavigationControl: vi.fn(),
    FullscreenControl: vi.fn(),
  },
}));

import { TerrainMap } from "./terrain-map";

const trails = [
  {
    slug: "a",
    name: "Trail A",
    region: "East",
    coordinates: { lat: 35.6, lng: -83.4 },
  },
  {
    slug: "b",
    name: "Trail B",
    region: "West",
    coordinates: { lat: 36.3, lng: -89.4 },
  },
];

describe("TerrainMap", () => {
  it("renders a labeled, accessible map region", () => {
    render(<TerrainMap trails={trails} />);
    expect(screen.getByLabelText(/3D terrain map/i)).toBeInTheDocument();
  });

  it("initializes the map with 3D terrain and one marker per trail", async () => {
    render(<TerrainMap trails={trails} />);
    await waitFor(() => expect(mocks.Map).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.setTerrain).toHaveBeenCalled());
    expect(mocks.Marker).toHaveBeenCalledTimes(trails.length);
  });
});

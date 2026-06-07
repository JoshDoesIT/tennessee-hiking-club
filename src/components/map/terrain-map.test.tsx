import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TENNESSEE_BOUNDS } from "@/lib/maps";

// WebGL can't run in jsdom, so we mock maplibre-gl and assert our wiring.
// Constructors must be `function` (not arrows) to be usable with `new`.
const mocks = vi.hoisted(() => {
  const on = vi.fn((evt: string, cb: () => void) => {
    if (evt === "load") cb();
  });
  const Map = vi.fn(function () {
    return {
      addControl: vi.fn(),
      on,
      resize: vi.fn(),
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
    return {
      setLngLat: vi.fn().mockReturnThis(),
      setDOMContent: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    };
  });
  return { Map, Marker, Popup };
});

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("maplibre-gl", () => ({
  default: {
    Map: mocks.Map,
    Marker: mocks.Marker,
    Popup: mocks.Popup,
    NavigationControl: vi.fn(),
    FullscreenControl: vi.fn(),
    GeolocateControl: vi.fn(),
  },
}));

import { TerrainMap } from "./terrain-map";

// Minimal OpenFreeMap-shaped style the component fetches before creating the map.
const baseStyle = {
  version: 8,
  sources: {},
  layers: [
    { id: "background", type: "background", paint: {} },
    { id: "water", type: "fill", paint: {} },
    {
      id: "label",
      type: "symbol",
      layout: { "text-field": "{name}" },
      paint: {},
    },
  ],
};

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => structuredClone(baseStyle),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const mapOptions = () => (mocks.Map as unknown as Mock).mock.calls[0][0];
const markerElements = (): HTMLElement[] =>
  (mocks.Marker as unknown as Mock).mock.calls.map((c) => c[0].element);

describe("TerrainMap", () => {
  it("renders a labeled, accessible map region", () => {
    render(<TerrainMap trails={trails} />);
    expect(screen.getByLabelText(/3D terrain map/i)).toBeInTheDocument();
  });

  it("opens framed to the whole state, level and north-up", async () => {
    render(<TerrainMap trails={trails} />);
    await waitFor(() => expect(mocks.Map).toHaveBeenCalledTimes(1));
    const opts = mapOptions();
    expect(opts.pitch).toBe(0);
    expect(opts.bearing).toBe(0);
    expect(opts.bounds).toEqual([
      [TENNESSEE_BOUNDS.lngMin, TENNESSEE_BOUNDS.latMin],
      [TENNESSEE_BOUNDS.lngMax, TENNESSEE_BOUNDS.latMax],
    ]);
  });

  it("creates the map with a pre-branded, terrain-enabled style (no flash)", async () => {
    render(<TerrainMap trails={trails} />);
    await waitFor(() => expect(mocks.Map).toHaveBeenCalledTimes(1));
    const style = mapOptions().style;
    expect(style.terrain).toBeTruthy();
    const ids = style.layers.map((l: { id: string }) => l.id);
    expect(ids).toEqual(
      expect.arrayContaining(["hillshade", "tn-mask", "tn-outline"]),
    );
  });

  it("adds one marker per trail", async () => {
    render(<TerrainMap trails={trails} />);
    await waitFor(() =>
      expect(mocks.Marker).toHaveBeenCalledTimes(trails.length),
    );
  });

  it("renders each pin as a link to its trail, named by trail and region", async () => {
    render(<TerrainMap trails={trails} />);
    await waitFor(() =>
      expect(mocks.Marker).toHaveBeenCalledTimes(trails.length),
    );
    for (const trail of trails) {
      const el = markerElements().find(
        (e) => e.getAttribute("href") === `/trails/${trail.slug}`,
      );
      // A real anchor: focusable and activates (navigates) on Enter.
      expect(el?.tagName).toBe("A");
      const label = el?.getAttribute("aria-label") ?? "";
      expect(label).toContain(trail.name);
      expect(label).toContain(trail.region);
    }
  });

  it("notes an alert in a pin's accessible label", async () => {
    render(
      <TerrainMap
        trails={[
          {
            slug: "c",
            name: "Closed Trail",
            region: "East",
            coordinates: { lat: 35.6, lng: -83.4 },
            alert: "closure",
          },
        ]}
      />,
    );
    await waitFor(() => expect(mocks.Marker).toHaveBeenCalledTimes(1));
    expect(markerElements()[0].getAttribute("aria-label")).toContain("Closure");
  });
});

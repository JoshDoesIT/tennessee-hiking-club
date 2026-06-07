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
import type { RoutePoint } from "@/lib/trails/elevation";

// WebGL can't run in jsdom, so mock maplibre-gl and assert our wiring.
const mocks = vi.hoisted(() => {
  const setData = vi.fn();
  const sources = new Set<string>();
  const addSource = vi.fn((id: string) => sources.add(id));
  const getSource = vi.fn((id: string) =>
    sources.has(id) ? { setData } : undefined,
  );
  const easeTo = vi.fn();
  const markerSetLngLat = vi.fn().mockReturnThis();
  const on = vi.fn((evt: string, cb: () => void) => {
    if (evt === "load") cb();
  });
  const Map = vi.fn(function () {
    return {
      addControl: vi.fn(),
      addSource,
      addLayer: vi.fn(),
      getSource,
      easeTo,
      on,
      resize: vi.fn(),
      remove: vi.fn(),
    };
  });
  const Marker = vi.fn(function () {
    return {
      setLngLat: markerSetLngLat,
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    };
  });
  return { Map, Marker, markerSetLngLat, addSource, easeTo, setData };
});

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("maplibre-gl", () => ({
  default: {
    Map: mocks.Map,
    Marker: mocks.Marker,
    NavigationControl: vi.fn(),
    GeolocateControl: vi.fn(function () {
      return { on: vi.fn(), trigger: vi.fn() };
    }),
  },
}));

import { RecordingMap } from "./recording-map";

const baseStyle = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: {} }],
};

const center = { lat: 35.6, lng: -83.4 };
const pt = (lat: number, lng: number): RoutePoint => ({
  lat,
  lng,
  elevationFt: 1000,
});

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

describe("RecordingMap", () => {
  it("renders an accessible live-position map region", () => {
    render(<RecordingMap center={center} points={[]} />);
    expect(
      screen.getByLabelText(/your position while recording/i),
    ).toBeInTheDocument();
  });

  it("centers on the latest recorded fix and marks it", async () => {
    const points = [pt(35.6, -83.4), pt(35.62, -83.42)];
    render(<RecordingMap center={center} points={points} />);

    await waitFor(() => expect(mocks.Map).toHaveBeenCalledTimes(1));
    expect(mapOptions().center).toEqual([-83.42, 35.62]);

    await waitFor(() => expect(mocks.Marker).toHaveBeenCalledTimes(1));
    expect(mocks.markerSetLngLat).toHaveBeenCalledWith([-83.42, 35.62]);
  });

  it("draws the recorded track and the trail route", async () => {
    render(
      <RecordingMap
        center={center}
        route={[
          { lat: 35.6, lng: -83.4 },
          { lat: 35.7, lng: -83.5 },
        ]}
        points={[pt(35.6, -83.4), pt(35.62, -83.42)]}
      />,
    );
    await waitFor(() => {
      const ids = mocks.addSource.mock.calls.map((c) => c[0]);
      expect(ids).toContain("recorded-track");
      expect(ids).toContain("trail-route");
    });
  });

  it("follows the device, recentering when a new fix arrives", async () => {
    const { rerender } = render(
      <RecordingMap center={center} points={[pt(35.6, -83.4)]} />,
    );
    await waitFor(() => expect(mocks.Map).toHaveBeenCalledTimes(1));

    rerender(
      <RecordingMap
        center={center}
        points={[pt(35.6, -83.4), pt(35.63, -83.43)]}
      />,
    );

    await waitFor(() =>
      expect(mocks.easeTo).toHaveBeenCalledWith(
        expect.objectContaining({ center: [-83.43, 35.63] }),
      ),
    );
    expect(mocks.setData).toHaveBeenCalled();
  });
});

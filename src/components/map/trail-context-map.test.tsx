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

// WebGL can't run in jsdom, so mock maplibre-gl and assert our wiring.
const mocks = vi.hoisted(() => {
  const markerSetLngLat = vi.fn().mockReturnThis();
  const on = vi.fn((evt: string, cb: () => void) => {
    if (evt === "load") cb();
  });
  const Map = vi.fn(function () {
    return { addControl: vi.fn(), on, resize: vi.fn(), remove: vi.fn() };
  });
  const Marker = vi.fn(function () {
    return { setLngLat: markerSetLngLat, addTo: vi.fn().mockReturnThis() };
  });
  return { Map, Marker, markerSetLngLat };
});

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("maplibre-gl", () => ({
  default: {
    Map: mocks.Map,
    Marker: mocks.Marker,
    NavigationControl: vi.fn(),
  },
}));

import { TrailContextMap } from "./trail-context-map";

const baseStyle = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: {} }],
};

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

describe("TrailContextMap", () => {
  it("renders a labeled map region for the trailhead", () => {
    render(
      <TrailContextMap
        coordinates={{ lat: 35.6, lng: -83.4 }}
        name="Mount X"
      />,
    );
    expect(screen.getByLabelText(/Mount X trailhead/i)).toBeInTheDocument();
  });

  it("centers on the trailhead and drops a marker there", async () => {
    render(
      <TrailContextMap
        coordinates={{ lat: 35.6, lng: -83.4 }}
        name="Mount X"
      />,
    );
    await waitFor(() => expect(mocks.Map).toHaveBeenCalledTimes(1));

    const opts = (mocks.Map as unknown as Mock).mock.calls[0][0];
    expect(opts.center).toEqual([-83.4, 35.6]);

    await waitFor(() => expect(mocks.Marker).toHaveBeenCalledTimes(1));
    expect(mocks.markerSetLngLat).toHaveBeenCalledWith([-83.4, 35.6]);
  });
});

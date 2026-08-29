import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordHike } from "./record-hike";
import { readLog } from "@/lib/hikes/local-log";
import { discardRecording, startRecording } from "@/lib/hikes/recording-store";

// The live recording map is WebGL (MapLibre); stub it so these control tests
// stay focused and fast. Its own behavior is covered in recording-map.test.tsx.
vi.mock("@/components/map/recording-map", () => ({
  RecordingMap: (props: { points: unknown[] }) => (
    <div data-testid="recording-map" data-points={props.points.length} />
  ),
}));

const coords = { lat: 35.6, lng: -83.45 };

function mockGeolocation() {
  let success: PositionCallback | null = null;
  let failure: PositionErrorCallback | null = null;
  const watchPosition = vi.fn(
    (s: PositionCallback, e: PositionErrorCallback) => {
      success = s;
      failure = e;
      return 7;
    },
  );
  const clearWatch = vi.fn();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { watchPosition, clearWatch, getCurrentPosition: vi.fn() },
  });
  return {
    watchPosition,
    clearWatch,
    emit: (lat: number, lng: number, altitude: number | null = null) =>
      act(() =>
        success?.({
          coords: { latitude: lat, longitude: lng, altitude },
        } as GeolocationPosition),
      ),
    fail: () => act(() => failure?.({} as GeolocationPositionError)),
  };
}

beforeEach(() => {
  localStorage.clear();
  discardRecording(); // reset the module-level store between tests
});
afterEach(() =>
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: undefined,
  }),
);

const recordButton = () =>
  screen.getByRole("button", { name: /record this hike/i });

describe("RecordHike", () => {
  it("starts a watch and shows the live controls", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    await user.click(recordButton());
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /finish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("shows the live point count as positions arrive", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    await user.click(recordButton());
    geo.emit(35.6, -83.45, 1000);
    geo.emit(35.62, -83.44, 1100);
    expect(screen.getByText(/2 pts/)).toBeInTheDocument();
  });

  it("saves the track and stops the watch after confirming finish", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    await user.click(recordButton());
    geo.emit(35.6, -83.45, 1000);
    geo.emit(35.62, -83.44, 1100);
    await user.click(screen.getByRole("button", { name: /^finish$/i }));
    await user.click(screen.getByRole("button", { name: /finish & save/i }));

    expect(geo.clearWatch).toHaveBeenCalled();
    const entry = readLog().find((e) => e.trailSlug === "grotto-falls");
    expect(entry?.track?.points.length).toBeGreaterThanOrEqual(2);
  });

  it("requires confirmation before discarding, and can be cancelled", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    await user.click(recordButton());
    geo.emit(35.6, -83.45, 1000);
    geo.emit(35.62, -83.44, 1100);

    // Discard asks first; "Keep recording" backs out without losing anything.
    await user.click(screen.getByRole("button", { name: /^discard$/i }));
    expect(screen.getByText(/can.t be undone/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /keep recording/i }));
    expect(screen.getByText(/2 pts/)).toBeInTheDocument();

    // Confirming actually discards.
    await user.click(screen.getByRole("button", { name: /^discard$/i }));
    await user.click(
      screen.getByRole("button", { name: /discard recording/i }),
    );
    expect(recordButton()).toBeInTheDocument();
    expect(readLog()).toEqual([]);
  });

  it("does not save when too few points were recorded", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    await user.click(recordButton());
    geo.emit(35.6, -83.45, 1000);
    await user.click(screen.getByRole("button", { name: /^finish$/i }));
    await user.click(screen.getByRole("button", { name: /finish & save/i }));

    expect(readLog()).toEqual([]);
    expect(screen.getByText(/not enough/i)).toBeInTheDocument();
  });

  it("pauses the watch and offers resume", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    await user.click(recordButton());
    await user.click(screen.getByRole("button", { name: /pause/i }));

    expect(geo.clearWatch).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
  });

  it("warns when a recording is already in progress on another trail", () => {
    mockGeolocation();
    act(() => startRecording("abrams-falls", "Abrams Falls"));
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    expect(screen.getByText(/already recording on/i)).toBeInTheDocument();
    expect(screen.getByText(/Abrams Falls/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /record this hike/i }),
    ).toBeNull();
  });

  it("reports when location is unavailable", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    await user.click(recordButton());
    expect(screen.getByText(/isn.t available/i)).toBeInTheDocument();
  });

  it("shows the live position map only while recording this trail", async () => {
    const geo = mockGeolocation();
    const user = userEvent.setup();
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    expect(screen.queryByTestId("recording-map")).toBeNull();

    await user.click(recordButton());
    geo.emit(35.6, -83.45, 1000);
    geo.emit(35.62, -83.44, 1100);

    const map = screen.getByTestId("recording-map");
    expect(map).toBeInTheDocument();
    expect(map).toHaveAttribute("data-points", "2");
  });

  it("does not show the live map for a recording on another trail", () => {
    mockGeolocation();
    act(() => startRecording("abrams-falls", "Abrams Falls"));
    render(
      <RecordHike
        slug="grotto-falls"
        trailName="Grotto Falls"
        coordinates={coords}
      />,
    );

    expect(screen.queryByTestId("recording-map")).toBeNull();
  });
});

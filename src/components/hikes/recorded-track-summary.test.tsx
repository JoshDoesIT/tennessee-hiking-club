import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordedTrackSummary } from "./recorded-track-summary";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

const track = {
  points: [
    { lat: 35.6, lng: -83.45, elevationFt: 1000 },
    { lat: 35.62, lng: -83.44, elevationFt: 1200 },
  ],
  durationMin: 90,
};

describe("RecordedTrackSummary", () => {
  it("shows distance, climb, and duration", () => {
    render(<RecordedTrackSummary track={track} trailName="Grotto Falls" />);
    expect(screen.getByText(/mi/)).toBeInTheDocument();
    expect(screen.getByText(/climb/)).toBeInTheDocument();
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
  });

  it("omits duration when the track has none", () => {
    render(
      <RecordedTrackSummary
        track={{ points: track.points }}
        trailName="Grotto Falls"
      />,
    );
    expect(screen.queryByText(/1h 30m/)).toBeNull();
  });

  it("offers a GPX download of the recorded track", () => {
    render(<RecordedTrackSummary track={track} trailName="Grotto Falls" />);
    expect(
      screen.getByRole("button", { name: /download gpx/i }),
    ).toBeInTheDocument();
  });

  it("renders both the route shape and the elevation profile for a moving track", () => {
    const { container } = render(
      <RecordedTrackSummary track={track} trailName="Grotto Falls" />,
    );
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
  });

  it("omits the route shape when the track has no movement", () => {
    const stationary = {
      points: [
        { lat: 35.6, lng: -83.45, elevationFt: 1000 },
        { lat: 35.6, lng: -83.45, elevationFt: 1000 },
      ],
    };
    const { container } = render(
      <RecordedTrackSummary track={stationary} trailName="Grotto Falls" />,
    );
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
  });

  it("renders nothing for a track with fewer than two points", () => {
    const { container } = render(
      <RecordedTrackSummary track={{ points: [] }} trailName="X" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

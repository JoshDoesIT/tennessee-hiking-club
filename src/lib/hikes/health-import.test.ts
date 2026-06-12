import { describe, it, expect, vi } from "vitest";
import {
  healthWorkoutToTrack,
  readHealthWorkouts,
  type HealthWorkout,
  type HealthPlugin,
} from "./health-import";

const sample = (latitude: number, longitude: number, altitude = 100) => ({
  latitude,
  longitude,
  altitude,
});

const route = (n: number) =>
  Array.from({ length: n }, (_, i) => sample(35.9 + i * 0.001, -83.9 - i * 0.001));

describe("healthWorkoutToTrack", () => {
  it("converts a workout's GPS route into a RecordedTrack", () => {
    const track = healthWorkoutToTrack({ route: route(3) });
    expect(track).not.toBeNull();
    expect(track!.points).toHaveLength(3);
    // Altitude (metres) becomes whole feet, the same as a recorded/GPX hike.
    expect(track!.points[0].elevationFt).toBe(328);
    expect(track!.points[0]).toMatchObject({ lat: 35.9, lng: -83.9 });
  });

  it("downsamples a long route to the point cap", () => {
    const track = healthWorkoutToTrack({ route: route(200) }, 70);
    expect(track!.points).toHaveLength(70);
  });

  it("derives the duration from the workout start/end", () => {
    const start = 1_700_000_000_000;
    const track = healthWorkoutToTrack({
      route: route(3),
      startDate: start,
      endDate: start + 45 * 60_000,
    });
    expect(track!.durationMin).toBe(45);
  });

  it("returns null for a workout with fewer than two route points", () => {
    expect(healthWorkoutToTrack({ route: route(1) })).toBeNull();
    expect(healthWorkoutToTrack({ route: [] })).toBeNull();
  });
});

function fakePlugin(over: Partial<HealthPlugin> = {}): HealthPlugin {
  return {
    isAvailable: vi.fn(async () => ({ available: true })),
    requestAuthorization: vi.fn(async () => ({ granted: true })),
    queryWorkouts: vi.fn(async () => ({ workouts: [] as HealthWorkout[] })),
    ...over,
  };
}

describe("readHealthWorkouts", () => {
  it("returns nothing when health data is unavailable", async () => {
    const plugin = fakePlugin({
      isAvailable: vi.fn(async () => ({ available: false })),
    });
    expect(await readHealthWorkouts(plugin)).toEqual([]);
    expect(plugin.requestAuthorization).not.toHaveBeenCalled();
  });

  it("returns nothing when authorization is denied", async () => {
    const plugin = fakePlugin({
      requestAuthorization: vi.fn(async () => ({ granted: false })),
    });
    expect(await readHealthWorkouts(plugin)).toEqual([]);
    expect(plugin.queryWorkouts).not.toHaveBeenCalled();
  });

  it("imports only workouts that have a usable route, as tracks", async () => {
    const plugin = fakePlugin({
      queryWorkouts: vi.fn(async () => ({
        workouts: [
          { id: "a", route: route(5), startDate: 1, endDate: 60_001 },
          { id: "b", route: route(1) }, // no usable route -> skipped
        ],
      })),
    });
    const out = await readHealthWorkouts(plugin);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
    expect(out[0].track.points.length).toBe(5);
  });
});

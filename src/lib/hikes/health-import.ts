import { downsampleRoute } from "@/lib/trails/route-import";
import { positionToPoint } from "@/lib/hikes/track";
import type { RecordedTrack } from "@/lib/hikes/types";

/**
 * Import hike routes from Apple Health / Android Health Connect (#269). The
 * native plugin reads workouts with their GPS route; this converts each into a
 * `RecordedTrack`, the same shape a recorded or GPX-imported hike uses, so an
 * imported workout lands on My Hikes identically. The plugin is injected
 * (`HealthPlugin`), so the conversion and orchestration are unit-tested without
 * a device; the concrete plugin + entitlements are bound in the credential
 * phase (like push registration).
 */

export interface HealthRouteSample {
  latitude: number;
  longitude: number;
  /** Metres above sea level, if the workout recorded it. */
  altitude?: number | null;
}

export interface HealthWorkout {
  /** Stable id from the health store, to dedupe re-imports. */
  id?: string;
  /** Epoch milliseconds. */
  startDate?: number;
  endDate?: number;
  route: HealthRouteSample[];
}

/** Convert a health workout's route into a `RecordedTrack`, or null when it has
 *  no usable route (fewer than two points). */
export function healthWorkoutToTrack(
  workout: HealthWorkout,
  maxPoints = 70,
): RecordedTrack | null {
  const route = workout.route ?? [];
  if (route.length < 2) return null;
  const points = downsampleRoute(
    route.map((s) =>
      positionToPoint({
        latitude: s.latitude,
        longitude: s.longitude,
        altitude: s.altitude ?? null,
      }),
    ),
    maxPoints,
  );
  if (points.length < 2) return null;
  const durationMin = workoutDurationMin(workout);
  return durationMin != null ? { points, durationMin } : { points };
}

function workoutDurationMin(workout: HealthWorkout): number | undefined {
  if (
    workout.startDate != null &&
    workout.endDate != null &&
    workout.endDate > workout.startDate
  ) {
    const minutes = Math.round((workout.endDate - workout.startDate) / 60000);
    return minutes > 0 ? minutes : undefined;
  }
  return undefined;
}

/**
 * The native health plugin surface this uses (Apple Health / Health Connect).
 * Bound to a concrete Capacitor plugin in the credential/entitlement phase.
 */
export interface HealthPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(): Promise<{ granted: boolean }>;
  queryWorkouts(opts: {
    startDate?: number;
    endDate?: number;
  }): Promise<{ workouts: HealthWorkout[] }>;
}

export type ImportableWorkout = {
  id?: string;
  startDate?: number;
  endDate?: number;
  track: RecordedTrack;
};

/**
 * Check availability, request authorization, and read recent workouts with GPS
 * routes converted to tracks ready to attach to a logged hike. Returns only the
 * workouts that have a usable route; an empty list when health data is
 * unavailable or authorization is declined.
 */
export async function readHealthWorkouts(
  plugin: HealthPlugin,
  opts: { startDate?: number; endDate?: number } = {},
): Promise<ImportableWorkout[]> {
  const { available } = await plugin.isAvailable();
  if (!available) return [];
  const { granted } = await plugin.requestAuthorization();
  if (!granted) return [];

  const { workouts } = await plugin.queryWorkouts(opts);
  const importable: ImportableWorkout[] = [];
  for (const workout of workouts) {
    const track = healthWorkoutToTrack(workout);
    if (track) {
      importable.push({
        id: workout.id,
        startDate: workout.startDate,
        endDate: workout.endDate,
        track,
      });
    }
  }
  return importable;
}

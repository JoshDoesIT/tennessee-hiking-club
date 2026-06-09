import { buildElevationProfile } from "@/lib/trails/elevation";
import type { RecordingSnapshot, RecordingStatus } from "./recording-store";

/**
 * Drive an iOS Live Activity / Dynamic Island for the active hike recording
 * (#268) from the recording store. The content derivation and the start/update/
 * end lifecycle are pure and unit-tested here; the concrete Capacitor Live
 * Activity plugin (and its SwiftUI widget + `NSSupportsLiveActivities`) are
 * bound in the entitlement phase, like push, and the on-device check is #324.
 */

export type LiveActivityContent = {
  trailName: string;
  distanceMi: number;
  elapsedMin: number;
};

/** The Live Activity fields for a recording snapshot. */
export function liveActivityContent(
  snapshot: RecordingSnapshot,
): LiveActivityContent {
  const distanceMi =
    snapshot.points.length >= 2
      ? buildElevationProfile(snapshot.points).totalMiles
      : 0;
  return {
    trailName: snapshot.trailName ?? "Recording a hike",
    distanceMi: Math.round(distanceMi * 10) / 10,
    elapsedMin: Math.round(snapshot.elapsedMs / 60000),
  };
}

export interface LiveActivityPlugin {
  start(content: LiveActivityContent): Promise<void>;
  update(content: LiveActivityContent): Promise<void>;
  end(): Promise<void>;
}

/** A recording session is "active" while recording or paused. */
const isActive = (status: RecordingStatus): boolean =>
  status === "recording" || status === "paused";

/**
 * Reconcile the Live Activity with a store transition: start it when a session
 * begins, update it while one is active (including across a pause), and end it
 * when the session stops.
 */
export async function syncRecordingActivity(
  plugin: LiveActivityPlugin,
  prev: RecordingSnapshot,
  next: RecordingSnapshot,
): Promise<void> {
  const was = isActive(prev.status);
  const now = isActive(next.status);
  if (!was && now) await plugin.start(liveActivityContent(next));
  else if (was && now) await plugin.update(liveActivityContent(next));
  else if (was && !now) await plugin.end();
}

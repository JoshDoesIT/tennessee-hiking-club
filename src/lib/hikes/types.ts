/** Suggested trail conditions for a logged hike (free-form is still allowed). */
export const HIKE_CONDITIONS = [
  "Dry",
  "Muddy",
  "Wet",
  "Snow or ice",
  "Overgrown",
  "Buggy",
] as const;

export type HikeCondition = (typeof HIKE_CONDITIONS)[number];

import type { RoutePoint } from "@/lib/trails/elevation";

/** A recorded GPS track for a hike (#201): the downsampled points (with
 *  elevation) and, when the source GPX had timestamps, the elapsed minutes. */
export type RecordedTrack = {
  points: RoutePoint[];
  durationMin?: number;
};

/** One logged hike: which trail, on what date (ISO `yyyy-mm-dd`), with an
 *  optional note, trail conditions, a photo, and a recorded GPS track. */
export type HikeLogEntry = {
  trailSlug: string;
  hikedOn: string;
  note?: string;
  conditions?: string;
  /** Local handle for the photo blob in IndexedDB (see `photo-store`). */
  photoId?: string;
  /** Remote photo URL once uploaded when signed in (account-backed sync). */
  photoUrl?: string;
  /** A recorded GPS track uploaded for this hike, if any. */
  track?: RecordedTrack;
};

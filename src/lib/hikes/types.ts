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
  /** Local handle for a single photo blob (legacy, pre-multi-photo). New hikes
   *  use `photoIds`; this is still read as a fallback so older logs keep their
   *  photo. See `entry-photos`. */
  photoId?: string;
  /** Remote URL for the legacy single photo once uploaded (account sync). */
  photoUrl?: string;
  /** Local handles for this hike's photo blobs in IndexedDB (see `photo-store`). */
  photoIds?: string[];
  /** Remote URLs for the photos once uploaded, aligned with `photoIds` by index. */
  photoUrls?: string[];
  /** A recorded GPS track uploaded for this hike, if any. */
  track?: RecordedTrack;
};

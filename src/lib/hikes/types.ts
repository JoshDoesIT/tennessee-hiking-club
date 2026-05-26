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

/** One logged hike: which trail, on what date (ISO `yyyy-mm-dd`), with an
 *  optional note and trail conditions. */
export type HikeLogEntry = {
  trailSlug: string;
  hikedOn: string;
  note?: string;
  conditions?: string;
};

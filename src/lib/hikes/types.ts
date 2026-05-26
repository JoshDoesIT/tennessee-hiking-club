/** One logged hike: which trail, on what date (ISO `yyyy-mm-dd`). */
export type HikeLogEntry = {
  trailSlug: string;
  hikedOn: string;
};

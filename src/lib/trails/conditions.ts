/**
 * Helpers for community-reported trail conditions. Reports and pinned alerts
 * live in trail front-matter; condition reports come in through a GitHub issue
 * form, and a maintainer curates them into the content.
 */
const REPO_URL = "https://github.com/JoshDoesIT/tennessee-hiking-club";

/** A report older than this many days is shown as out of date. */
export const STALE_AFTER_DAYS = 30;

const MS_PER_DAY = 86_400_000;

export function isStaleReport(dateIso: string, now: Date): boolean {
  const reported = new Date(`${dateIso}T00:00:00Z`);
  const ageDays = (now.getTime() - reported.getTime()) / MS_PER_DAY;
  return ageDays > STALE_AFTER_DAYS;
}

/** Newest first. Returns a new array; the input is not mutated. */
export function sortReportsByDateDesc<T extends { date: string }>(
  reports: T[],
): T[] {
  return [...reports].sort((a, b) => b.date.localeCompare(a.date));
}

/** A link to the condition-report issue form, prefilled with the trail. */
export function conditionReportUrl(trail: {
  slug: string;
  name: string;
}): string {
  const params = new URLSearchParams({
    template: "trail_condition.yml",
    title: `[Conditions]: ${trail.name}`,
    trail: trail.name,
  });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

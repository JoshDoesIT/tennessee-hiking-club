/**
 * The app routes worth precaching for offline use (#244). The static, navigable
 * pages plus a page per trail. Kept deduped and asset/API-free so the service
 * worker can fetch each one and cache it on the first online visit, instead of
 * only caching pages lazily as they are browsed.
 */
export const STATIC_ROUTES = [
  "/",
  "/trails",
  "/explore",
  "/hikes",
  "/record",
  "/more",
  "/leaderboard",
  "/about",
  "/contribute",
  "/contributors",
  "/credits",
  "/accessibility",
  "/leave-no-trace",
  "/privacy",
  "/shop",
  "/signin",
] as const;

export function appRoutes(trailSlugs: string[]): string[] {
  const trailRoutes = trailSlugs.map((slug) => `/trails/${slug}`);
  return [...new Set([...STATIC_ROUTES, ...trailRoutes])];
}

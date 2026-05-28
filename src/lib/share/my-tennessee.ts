import { SITE_URL } from "@/lib/site";
import type { Trail } from "@/lib/trails/schema";

/**
 * Build the canonical share URL for a "my Tennessee" map of hiked slugs.
 * Returns null when there is nothing to share so callers can hide the UI.
 * Slugs are de-duplicated and joined into a single comma-separated path
 * segment - allowed by RFC 3986 and kept un-encoded so the URL reads as
 * an obvious list.
 */
export function myTennesseeShareUrl(
  slugs: string[],
  origin: string = SITE_URL,
): string | null {
  const clean = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
  if (clean.length === 0) return null;
  return `${origin}/share/my-tennessee/${clean.join(",")}`;
}

/**
 * Filter a comma-separated route segment to only known, distinct trail slugs.
 * Used by the share page and its OG image generator so unknown input is
 * dropped gracefully instead of throwing.
 */
export function parseShareSlugs(raw: string, trails: Trail[]): string[] {
  const known = new Set(trails.map((t) => t.slug));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of raw.split(",")) {
    const trimmed = s.trim();
    if (known.has(trimmed) && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

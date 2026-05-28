import type { Metadata } from "next";

export type PageMetadataInput = {
  /** The page title (also used as `<title>` and OG/Twitter title). */
  title: string;
  /** The page description (also used as OG/Twitter description). */
  description: string;
  /** The site-relative path (e.g. `/leaderboard`). Used for the canonical link
   *  and the `og:url` so each page share-previews as itself. */
  path: string;
  /** When true, sets `robots: { index: false }` (e.g. private device-only views). */
  noindex?: boolean;
};

/**
 * Per-page metadata builder. Without this, pages would inherit the root
 * layout's openGraph/twitter title, description, and url, so every share
 * preview would look like the homepage.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: { index: false } } : {}),
  };
}

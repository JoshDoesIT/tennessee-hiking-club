import type { Metadata } from "next";
import type { Trail } from "./schema";

/** Per-trail page metadata: title, description, and Open Graph / Twitter cards. */
export function trailMetadata(trail: Trail): Metadata {
  const photo = trail.photos[0];
  const images = photo ? [{ url: photo.src, alt: photo.alt }] : undefined;

  return {
    title: trail.name,
    description: trail.summary,
    alternates: { canonical: `/trails/${trail.slug}` },
    openGraph: {
      type: "article",
      title: trail.name,
      description: trail.summary,
      url: `/trails/${trail.slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: trail.name,
      description: trail.summary,
      images: photo ? [photo.src] : undefined,
    },
  };
}

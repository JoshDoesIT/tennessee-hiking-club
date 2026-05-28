import type { Metadata } from "next";
import type { Trail } from "./schema";
import { SITE_URL } from "@/lib/site";

/** Per-trail page metadata: title, description, and Open Graph / Twitter cards. */
export function trailMetadata(trail: Trail): Metadata {
  // The OG/Twitter image comes from the file-based opengraph-image route
  // (a generated branded card per trail), so no images are set here.
  return {
    title: trail.name,
    description: trail.summary,
    alternates: { canonical: `/trails/${trail.slug}` },
    openGraph: {
      type: "article",
      title: trail.name,
      description: trail.summary,
      url: `/trails/${trail.slug}`,
      images: [
        {
          url: `/trails/${trail.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Trail card for ${trail.name} in ${trail.region} Tennessee`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: trail.name,
      description: trail.summary,
      images: [
        {
          url: `/trails/${trail.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Trail card for ${trail.name} in ${trail.region} Tennessee`,
        },
      ],
    },
  };
}

/** schema.org TouristAttraction structured data (JSON-LD) for a trail. */
export function trailJsonLd(trail: Trail) {
  const photo = trail.photos[0];
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: trail.name,
    description: trail.summary,
    url: `${SITE_URL}/trails/${trail.slug}`,
    ...(photo ? { image: `${SITE_URL}${photo.src}` } : {}),
    geo: {
      "@type": "GeoCoordinates",
      latitude: trail.coordinates.lat,
      longitude: trail.coordinates.lng,
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: "TN",
      addressCountry: "US",
    },
  };
}

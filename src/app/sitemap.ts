import type { MetadataRoute } from "next";
import { getAllTrails } from "@/lib/trails";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/trails`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${SITE_URL}/contribute`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const trailRoutes: MetadataRoute.Sitemap = getAllTrails().map((trail) => ({
    url: `${SITE_URL}/trails/${trail.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...trailRoutes].map((entry) => ({
    lastModified: now,
    ...entry,
  }));
}

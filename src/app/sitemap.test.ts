import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";
import { getAllTrails } from "@/lib/trails";
import { SITE_URL } from "@/lib/site";

describe("sitemap", () => {
  it("includes an entry for every trail", () => {
    const urls = sitemap().map((e) => e.url);
    for (const trail of getAllTrails()) {
      expect(urls).toContain(`${SITE_URL}/trails/${trail.slug}`);
    }
  });

  it("includes the core static routes", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/trails`);
    expect(urls).toContain(`${SITE_URL}/explore`);
  });

  it("uses absolute URLs for every entry", () => {
    for (const entry of sitemap()) {
      expect(entry.url.startsWith("https://")).toBe(true);
    }
  });
});

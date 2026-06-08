import { Suspense } from "react";
import { pageMetadata } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";
import { TrailBrowser } from "@/components/trails/trail-browser";
import { TrailResults } from "@/components/trails/trail-results";
import { getAllTrails } from "@/lib/trails";

export const metadata = pageMetadata({
  title: "Trails",
  description:
    "Browse Tennessee hiking trails by region, difficulty, and length.",
  path: "/trails",
});

// Static so it can be bundled into the native app (#308, spec 0009): the page
// renders every trail, and TrailBrowser filters on the device from the URL.
export default function TrailsPage() {
  const trails = getAllTrails();

  return (
    <Container className="py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Trail directory</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Every trail, in one place
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Filter by region, difficulty, and length, then open a trail for photos,
        stats, and one-tap directions.
      </p>

      {/* TrailBrowser reads the URL via useSearchParams, which needs a Suspense
          boundary to stay statically renderable. The fallback lists every trail
          so the static HTML keeps the trail links (SEO + first paint). */}
      <Suspense
        fallback={
          <section aria-label="Trail results" className="mt-8">
            <p className="text-ink/70 text-sm">{trails.length} trails</p>
            <TrailResults trails={trails} />
          </section>
        }
      >
        <TrailBrowser trails={trails} />
      </Suspense>
    </Container>
  );
}

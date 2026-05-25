import type { Metadata } from "next";
import Link from "next/link";
import { TennesseeMap } from "@/components/map/tennessee-map";
import { Container } from "@/components/ui/container";
import { getAllTrails } from "@/lib/trails";

export const metadata: Metadata = {
  title: "Explore the map",
  description:
    "An interactive, stylized map of Tennessee with a pin for every trail.",
};

export default function ExplorePage() {
  const trails = getAllTrails();

  return (
    <Container className="py-16 sm:py-20">
      <p className="eyebrow text-amber-600">Interactive map</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Explore Tennessee
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Tap a pin to open the trail — {trails.length} across all three Grand
        Divisions, and growing.
      </p>

      <div className="mt-10">
        <TennesseeMap />
      </div>

      {/* Non-visual / small-screen fallback: the same trails as a list. */}
      <section className="mt-12">
        <h2 className="display text-forest text-2xl">All trails</h2>
        <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {trails.map((trail) => (
            <li
              key={trail.slug}
              className="border-forest/5 flex items-baseline justify-between gap-3 border-b py-1.5"
            >
              <Link
                href={`/trails/${trail.slug}`}
                className="text-pine hover:text-forest font-medium underline-offset-4 hover:underline"
              >
                {trail.name}
              </Link>
              <span className="text-ink/50 shrink-0 text-sm">
                {trail.region} TN
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}

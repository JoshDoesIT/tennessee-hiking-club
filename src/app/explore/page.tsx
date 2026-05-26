import type { Metadata } from "next";
import Link from "next/link";
import { TerrainMap } from "@/components/map/terrain-map";
import { Container } from "@/components/ui/container";
import { getAllTrails } from "@/lib/trails";

export const metadata: Metadata = {
  title: "Explore the map",
  description:
    "An interactive 3D terrain map of Tennessee with a pin for every trail.",
};

export default function ExplorePage() {
  const trails = getAllTrails();
  const pins = trails.map((trail) => ({
    slug: trail.slug,
    name: trail.name,
    region: trail.region,
    coordinates: trail.coordinates,
  }));

  return (
    <Container className="py-12 sm:py-16">
      <p className="eyebrow text-amber-600">Interactive map</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Explore Tennessee
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Tilt, rotate, and zoom the terrain, then tap a pin to open the trail.{" "}
        {trails.length} across all three Grand Divisions.
      </p>

      <div className="mt-8">
        <TerrainMap trails={pins} />
      </div>

      {/* Accessible / no-WebGL fallback: every trail as a plain link. */}
      <section aria-labelledby="all-trails-heading" className="mt-10">
        <h2 id="all-trails-heading" className="display text-forest text-2xl">
          All trails
        </h2>
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

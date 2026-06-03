import Link from "next/link";
import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";
import { getAllTrails } from "@/lib/trails";

export const metadata = pageMetadata({
  title: "Record a hike",
  description: "Track your route as you hike, then pick the trail you are on.",
  path: "/record",
  noindex: true,
});

export default function RecordPage() {
  const trails = getAllTrails();
  return (
    <Container className="py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Record</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Record a hike
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Your phone can track your route as you hike, even with the screen off. A
        recording attaches to a trail, so choose the one you are on to start.
      </p>

      <ul className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2">
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
            <span className="text-ink/70 shrink-0 text-sm">
              {trail.region} TN
            </span>
          </li>
        ))}
      </ul>
    </Container>
  );
}

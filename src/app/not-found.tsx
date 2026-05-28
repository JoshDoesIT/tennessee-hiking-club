import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Trailhead not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <Container className="max-w-2xl py-20 text-center sm:py-28">
      <p className="eyebrow text-amber-700">404</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Trailhead not found
      </h1>
      <p className="text-ink/70 mt-4 leading-relaxed">
        We couldn&apos;t find the page you were looking for. It may have been
        moved, or the link might be off the map.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm">
        <Link
          href="/"
          className="text-pine hover:text-forest font-medium underline-offset-4 hover:underline"
        >
          Back to the homepage
        </Link>
        <Link
          href="/explore"
          className="text-pine hover:text-forest font-medium underline-offset-4 hover:underline"
        >
          Explore the map
        </Link>
        <Link
          href="/trails"
          className="text-pine hover:text-forest font-medium underline-offset-4 hover:underline"
        >
          Browse trails
        </Link>
      </div>
    </Container>
  );
}

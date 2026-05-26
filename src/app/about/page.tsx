import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About the club",
  description:
    "The Tennessee Hiking Club is a free, open-source, community project mapping the Volunteer State's best trails.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-20 sm:py-28">
      <p className="eyebrow text-amber-700">About the club</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        For everyone who loves Tennessee on foot
      </h1>

      <div className="text-ink/75 mt-8 space-y-5 text-lg leading-relaxed">
        <p>
          The Tennessee Hiking Club started with a simple idea: the Volunteer
          State has some of the best hiking in the country, and finding it
          should be easy, beautiful, and free.
        </p>
        <p>
          We&rsquo;re building an interactive, stylized map of Tennessee where
          every trail has photos, coordinates, and one-tap directions to the
          trailhead, from the high balds of the Smokies to the waterfalls of the
          Cumberland Plateau and the quiet bottomlands of West Tennessee.
        </p>
        <p>
          The whole project is{" "}
          <Link
            href="https://github.com/JoshDoesIT/tennessee-hiking-club"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pine font-semibold underline underline-offset-4"
          >
            open source
          </Link>
          . Anyone can suggest a trail, fix a detail, or help build a feature. A
          small merch shop is on the way to help cover hosting and domain costs;
          everything else runs on community effort.
        </p>
        <p className="text-forest font-medium">
          We hike responsibly and practice Leave No Trace. Pack it in, pack it
          out, and leave the trail better than you found it.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/explore" className={buttonVariants()}>
          Explore the map
        </Link>
        <Link
          href="/contribute"
          className={buttonVariants({ variant: "outline" })}
        >
          Contribute a trail
        </Link>
      </div>
    </article>
  );
}

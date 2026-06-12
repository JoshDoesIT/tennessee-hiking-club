import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getAllTrails } from "@/lib/trails";
import { tennesseeMapData } from "@/components/map/map-data";
import { ShareTennesseeMap } from "@/components/share/share-tennessee-map";
import { CopyCurrentUrlButton } from "@/components/share/copy-current-url-button";
import { pageMetadata } from "@/lib/page-metadata";
import { parseShareSlugs } from "@/lib/share/my-tennessee";

type Params = { params: Promise<{ slugs: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slugs } = await params;
  const hiked = parseShareSlugs(slugs, getAllTrails());
  if (hiked.length === 0) return {};
  const title = `My Tennessee: ${hiked.length} ${
    hiked.length === 1 ? "trail" : "trails"
  } hiked`;
  return pageMetadata({
    title,
    description:
      "Trails hiked across Tennessee, shared from the Tennessee Hiking Club.",
    path: `/share/my-tennessee/${hiked.join(",")}`,
  });
}

export default async function ShareMyTennesseePage({ params }: Params) {
  const { slugs } = await params;
  const allTrails = getAllTrails();
  const hiked = parseShareSlugs(slugs, allTrails);
  if (hiked.length === 0) notFound();

  const hikedSet = new Set(hiked);
  const hikedTrails = allTrails.filter((t) => hikedSet.has(t.slug));
  const regions = new Set(hikedTrails.map((t) => t.region));
  const mapData = tennesseeMapData(allTrails);

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">
        Shared from Tennessee Hiking Club
      </p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        My Tennessee
      </h1>
      <p className="text-ink/75 mt-3 text-lg leading-relaxed">
        {hiked.length} {hiked.length === 1 ? "trail" : "trails"} hiked across{" "}
        {regions.size} of 3 Grand Divisions.
      </p>

      <div className="mt-8">
        <ShareTennesseeMap data={mapData} hikedSlugs={hiked} />
      </div>

      <h2 className="display text-forest mt-12 text-2xl">Trails on this map</h2>
      <ul className="mt-4 space-y-1.5">
        {hikedTrails.map((t) => (
          <li
            key={t.slug}
            className="border-forest/5 border-b py-1.5 last:border-b-0"
          >
            <Link
              href={`/trails/${t.slug}`}
              className="text-pine hover:text-forest font-medium underline-offset-4 hover:underline"
            >
              {t.name}
            </Link>{" "}
            <span className="text-ink/60 text-sm">· {t.region} Tennessee</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <CopyCurrentUrlButton />
      </div>

      <p className="text-ink/60 mt-8 text-sm">
        Want your own?{" "}
        <Link
          href="/hikes"
          className="text-pine hover:text-forest underline underline-offset-4"
        >
          Track yours on My hikes
        </Link>
        .
      </p>
    </Container>
  );
}

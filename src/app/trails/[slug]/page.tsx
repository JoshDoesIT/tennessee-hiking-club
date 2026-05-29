import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTrails, getTrailBySlug } from "@/lib/trails";
import { trailMetadata, trailJsonLd } from "@/lib/trails/metadata";
import { googleMapsDirectionsUrl } from "@/lib/maps";
import { TrailGallery } from "@/components/trails/trail-gallery";
import { WeatherForecast } from "@/components/trails/weather-forecast";
import { fetchTrailWeather } from "@/lib/weather/forecast";
import { TrailContextMap } from "@/components/map/trail-context-map";
import { TrailConditions } from "@/components/trails/trail-conditions";
import { TrailParking } from "@/components/trails/trail-parking";
import { ElevationProfile } from "@/components/trails/elevation-profile";
import { DownloadGpx } from "@/components/trails/download-gpx";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MarkHiked } from "@/components/hikes/mark-hiked";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllTrails().map((trail) => ({ slug: trail.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trail = getTrailBySlug(slug);
  if (!trail) return {};
  return trailMetadata(trail);
}

export default async function TrailPage({ params }: Params) {
  const { slug } = await params;
  const trail = getTrailBySlug(slug);
  if (!trail) notFound();

  const weather = await fetchTrailWeather(
    trail.coordinates.lat,
    trail.coordinates.lng,
  );

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trailJsonLd(trail)) }}
      />
      <Link href="/explore" className="text-olive hover:text-forest text-sm">
        ← Back to the map
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Badge variant="forest">{trail.region} Tennessee</Badge>
        <span className="text-ink/70 text-sm">{trail.area}</span>
      </div>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        {trail.name}
      </h1>
      <p className="text-ink/75 mt-3 text-lg leading-relaxed">
        {trail.summary}
      </p>

      <div className="mt-6">
        <MarkHiked slug={trail.slug} />
      </div>

      <TrailGallery photos={trail.photos} />

      <dl className="border-forest/10 bg-cream-50 mt-6 grid grid-cols-2 gap-4 rounded-2xl border p-5 sm:grid-cols-4">
        <Stat label="Length" value={`${trail.lengthMiles} mi`} />
        <Stat
          label="Elevation gain"
          value={`${trail.elevationGainFt.toLocaleString()} ft`}
        />
        <Stat label="Difficulty" value={trail.difficulty} />
        <Stat label="Route" value={trail.routeType} />
      </dl>

      <TrailConditions trail={trail} />

      {trail.route && trail.route.length > 1 ? (
        <div className="mt-2">
          <ElevationProfile route={trail.route} />
          <div className="mt-4">
            <DownloadGpx trail={{ name: trail.name, route: trail.route }} />
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="display text-forest text-2xl">Find the trailhead</h2>
        <div className="mt-4">
          <TrailContextMap
            coordinates={trail.coordinates}
            name={trail.name}
            parking={trail.parking}
          />
        </div>
        <div className="mt-4">
          <a
            href={googleMapsDirectionsUrl(trail.coordinates)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "accent" })}
          >
            Open in Google Maps
          </a>
        </div>
        {trail.parking ? <TrailParking parking={trail.parking} /> : null}
      </section>

      <WeatherForecast weather={weather} />

      <div className="text-ink/80 mt-8 space-y-4 leading-relaxed">
        {trail.body.split(/\n\n+/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {trail.tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {trail.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-olive text-xs font-semibold tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-forest mt-1 font-medium capitalize">{value}</dd>
    </div>
  );
}

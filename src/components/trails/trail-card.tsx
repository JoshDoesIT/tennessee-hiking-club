import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Trail } from "@/lib/trails/schema";

/** A single trail in the directory grid: thumbnail, region, difficulty, stats. */
export function TrailCard({ trail }: { trail: Trail }) {
  const thumb = trail.photos[0];
  return (
    <Card interactive className="overflow-hidden p-0">
      <Link
        href={`/trails/${trail.slug}`}
        className="block focus-visible:outline-none"
      >
        <div className="bg-sage-100/40 relative aspect-[16/10]">
          {thumb ? (
            <Image
              src={thumb.src}
              alt={thumb.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{trail.region} TN</Badge>
            <Badge variant="soft">{trail.difficulty}</Badge>
          </div>
          <h3 className="display text-forest mt-3 text-xl leading-tight">
            {trail.name}
          </h3>
          <p className="text-ink/70 mt-1 text-sm">
            {trail.lengthMiles} mi · {trail.area}
          </p>
        </div>
      </Link>
    </Card>
  );
}

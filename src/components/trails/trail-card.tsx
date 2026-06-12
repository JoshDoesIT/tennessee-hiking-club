import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { highestAlertLevel, ALERT_LABEL } from "@/lib/trails/conditions";
import type { Trail } from "@/lib/trails/schema";

/** A single trail in the directory grid: thumbnail, region, difficulty, stats.
 *  `distanceMi` is shown when the list is sorted by distance from the user. */
export function TrailCard({
  trail,
  distanceMi,
}: {
  trail: Trail;
  distanceMi?: number;
}) {
  const thumb = trail.photos[0];
  const alertLevel = highestAlertLevel(trail.alerts);
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
            {alertLevel ? (
              <Badge
                className={
                  alertLevel === "closure"
                    ? "text-cream bg-amber-700"
                    : alertLevel === "caution"
                      ? "bg-amber/25 text-amber-700"
                      : "border-forest/20 text-olive border"
                }
              >
                {ALERT_LABEL[alertLevel]}
              </Badge>
            ) : null}
          </div>
          <h3 className="display text-forest mt-3 text-xl leading-tight">
            {trail.name}
          </h3>
          <p className="text-ink/70 mt-1 text-sm">
            {trail.lengthMiles} mi · {trail.area}
          </p>
          {distanceMi != null ? (
            <p className="text-olive mt-1 text-xs font-medium">
              {Math.round(distanceMi)} mi away
            </p>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}

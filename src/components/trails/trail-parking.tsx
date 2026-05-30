import { googleMapsDirectionsUrl } from "@/lib/maps";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TrailParking as TrailParkingData } from "@/lib/trails/schema";

/**
 * Trailhead parking: where to actually leave the car, with directions straight
 * to the lot (often offset from the trail start) plus any fee/capacity and
 * seasonal access notes. When `source` is "osm" the lot came from the
 * OpenStreetMap fallback (#141) rather than declared content, so it is labelled
 * and attributed.
 */
export function TrailParking({
  parking,
  source = "content",
}: {
  parking: TrailParkingData;
  source?: "content" | "osm";
}) {
  return (
    <div className="border-forest/10 bg-cream-50 mt-4 rounded-xl border p-4">
      <h3 className="text-olive text-xs font-semibold tracking-wider uppercase">
        Parking
      </h3>
      {source === "osm" ? (
        <p className="text-ink/70 mt-1 text-sm">
          Nearest parking from OpenStreetMap (not verified by us).
        </p>
      ) : null}
      {parking.note ? (
        <p className="text-ink/80 mt-1 text-sm">{parking.note}</p>
      ) : null}
      {parking.seasonal ? (
        <p className="text-amber-700 mt-1 text-sm">{parking.seasonal}</p>
      ) : null}
      <a
        href={googleMapsDirectionsUrl(parking)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-3",
        )}
      >
        Directions to parking
      </a>
      {source === "osm" ? (
        <p className="text-ink/70 mt-2 text-xs">
          Parking data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            OpenStreetMap
          </a>{" "}
          contributors.
        </p>
      ) : null}
    </div>
  );
}

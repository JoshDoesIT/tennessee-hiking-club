import { googleMapsDirectionsUrl } from "@/lib/maps";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TrailParking as TrailParkingData } from "@/lib/trails/schema";

/**
 * Trailhead parking: where to actually leave the car, with directions straight
 * to the lot (often offset from the trail start) plus any fee/capacity and
 * seasonal access notes.
 */
export function TrailParking({ parking }: { parking: TrailParkingData }) {
  return (
    <div className="border-forest/10 bg-cream-50 mt-4 rounded-xl border p-4">
      <h3 className="text-olive text-xs font-semibold tracking-wider uppercase">
        Parking
      </h3>
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
    </div>
  );
}

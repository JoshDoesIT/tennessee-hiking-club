import Image from "next/image";
import type { Trail } from "@/lib/trails/schema";

/**
 * Trail photo gallery. The first photo is the hero (full width); any further
 * photos tile beneath it. Each photo keeps its alt text and optional credit.
 */
export function TrailGallery({ photos }: { photos: Trail["photos"] }) {
  if (photos.length === 0) return null;

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {photos.map((photo, i) => (
        <figure
          key={`${photo.src}-${i}`}
          className={i === 0 ? "sm:col-span-2" : ""}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            width={1200}
            height={800}
            className="border-forest/10 w-full rounded-2xl border object-cover"
            priority={i === 0}
          />
          {photo.credit ? (
            <figcaption className="text-ink/70 mt-1 text-xs">
              {photo.credit}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

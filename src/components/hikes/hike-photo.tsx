"use client";

import { useEffect, useState } from "react";
import { getPhoto } from "@/lib/hikes/photo-store";

/**
 * Thumbnail for a hike photo. Prefers the local IndexedDB copy (`photoId`) when
 * present — instant and free — rendering it via an object URL that is revoked
 * on cleanup. Otherwise (e.g. on another device after sync) it serves the
 * private remote photo through the auth-gated view proxy, since private blobs
 * can't be embedded by URL directly. Renders nothing when there is no photo.
 */
export function HikePhoto({
  photoId,
  photoUrl,
  alt,
  className,
}: {
  photoId?: string;
  photoUrl?: string;
  alt: string;
  className?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!photoId) return;
    let cancelled = false;
    let created: string | undefined;
    void getPhoto(photoId).then((blob) => {
      if (cancelled || !blob) return;
      created = URL.createObjectURL(blob);
      setObjectUrl(created);
    });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [photoId]);

  const remoteSrc = photoUrl
    ? `/api/hikes/photo?u=${encodeURIComponent(photoUrl)}`
    : undefined;
  const src = photoId ? objectUrl : remoteSrc;
  if (!src) return null;

  return (
    // Object URLs can't go through next/image; a plain img is correct here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={className} />
  );
}

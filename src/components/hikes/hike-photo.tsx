"use client";

import { useEffect, useState } from "react";
import { getPhoto } from "@/lib/hikes/photo-store";

/**
 * Thumbnail for a hike photo. Prefers the remote `photoUrl` (account-backed)
 * when present; otherwise loads the local blob from IndexedDB by `photoId` and
 * renders it via an object URL, revoking it on cleanup to avoid leaks. Renders
 * nothing when there is no photo.
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
    // Remote URL or no photo: nothing to load from IndexedDB.
    if (photoUrl || !photoId) return;
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
  }, [photoId, photoUrl]);

  const src = photoUrl ?? objectUrl;
  if (!src) return null;

  return (
    // Object URLs can't go through next/image; a plain img is correct here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={className} />
  );
}

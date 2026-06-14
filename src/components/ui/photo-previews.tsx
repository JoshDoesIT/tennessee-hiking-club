"use client";

import { useEffect, useMemo } from "react";

/**
 * Thumbnails of locally-selected image files, shown before upload so a member
 * can confirm they picked the right photo. The native file control gives no
 * useful preview (on iOS it can show a black square for HEIC), so this renders
 * the chosen images directly via object URLs, which the WebView decodes fine.
 * URLs are revoked when the selection changes or the component unmounts.
 */
export function PhotoPreviews({
  files,
  className,
}: {
  files: File[];
  className?: string;
}) {
  const images = files.filter((f) => f.type.startsWith("image/"));

  // Re-create object URLs only when the actual selection changes, not on every
  // parent render (callers often pass a fresh array each time).
  const signature = images
    .map((f) => `${f.name}:${f.size}:${f.lastModified}`)
    .join("|");

  const urls = useMemo(
    () => images.map((f) => URL.createObjectURL(f)),
    // `signature` captures the meaningful contents of `images`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );

  // Free each batch of URLs when the selection changes or the component leaves.
  useEffect(() => {
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [urls]);

  if (urls.length === 0) return null;

  return (
    <ul
      aria-label="Selected photo preview"
      className={className ?? "mt-1 flex flex-wrap gap-2"}
    >
      {urls.map((url, i) => (
        <li key={url}>
          {/* Object URLs can't go through next/image; a plain img is correct. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Selected photo ${i + 1}`}
            className="border-forest/15 h-20 w-20 rounded-lg border object-cover"
          />
        </li>
      ))}
    </ul>
  );
}

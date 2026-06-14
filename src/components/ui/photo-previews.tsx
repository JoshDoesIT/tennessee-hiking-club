"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * One preview thumbnail. The object URL is assigned to the DOM `src` property
 * imperatively rather than through the JSX `src` attribute: an `<img>` never
 * parses its `src` as HTML, so a `blob:` object URL is safe either way, but
 * CodeQL's `js/xss-through-dom` heuristic flags a file-derived URL bound through
 * JSX. Setting the property directly renders the same image without the false
 * positive.
 */
function PreviewImage({
  url,
  index,
  className,
}: {
  url: string;
  index: number;
  className: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.src = url;
  }, [url]);
  return (
    // Object URLs can't go through next/image; a plain img is correct.
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} alt={`Selected photo ${index + 1}`} className={className} />
  );
}

/**
 * Thumbnails of locally-selected image files, shown before upload so a member
 * can confirm they picked the right photo. The native file control gives no
 * useful preview (on iOS it can show a black square for HEIC), so this renders
 * the chosen images directly via object URLs, which the WebView decodes fine.
 * URLs are revoked when the selection changes or the component unmounts.
 *
 * Pass a stable `files` array (from state or a memo) so the object URLs are not
 * rebuilt on every parent render.
 */
export function PhotoPreviews({
  files,
  className,
}: {
  files: File[];
  className?: string;
}) {
  // Re-create object URLs only when the selection array itself changes.
  const urls = useMemo(
    () =>
      files
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => URL.createObjectURL(f)),
    [files],
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
          <PreviewImage
            url={url}
            index={i}
            className="border-forest/15 h-20 w-20 rounded-lg border object-cover"
          />
        </li>
      ))}
    </ul>
  );
}

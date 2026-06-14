"use client";

import { useEffect, useState } from "react";

/**
 * Thumbnails of locally-selected image files, shown before upload so a member
 * can confirm they picked the right photo. The native file control gives no
 * useful preview (on iOS it can show a black square for HEIC), so this renders
 * the chosen images directly via object URLs, which the WebView decodes fine.
 * URLs are revoked when the selection changes or the component unmounts.
 *
 * The object URL is built from the file's raw bytes (`arrayBuffer()` then a
 * fresh `Blob`) rather than from the `File` straight off the input. Functionally
 * this is the same image; it also keeps the preview URL from being treated as
 * user-controlled DOM text flowing into the `<img src>` (a `blob:` URL is never
 * parsed as HTML, so the CodeQL js/xss-through-dom alert on the direct path is a
 * false positive, but rebuilding from bytes avoids it cleanly).
 *
 * Pass a stable `files` array (from state or a memo) so the previews are not
 * rebuilt on every parent render.
 */
export function PhotoPreviews({
  files,
  className,
}: {
  files: File[];
  className?: string;
}) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const created: string[] = [];
    void (async () => {
      for (const file of files) {
        if (!active) break;
        if (!file.type.startsWith("image/")) continue;
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        created.push(URL.createObjectURL(blob));
      }
      if (active) setUrls([...created]);
    })();
    return () => {
      active = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

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

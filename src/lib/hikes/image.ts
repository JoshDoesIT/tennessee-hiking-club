/**
 * Client-side image helpers for per-hike photos. Photos are downscaled and
 * re-encoded before they are stored, so IndexedDB (local-first) and, later,
 * Vercel Blob (when signed in) stay small. The data-URL helpers carry photos
 * through JSON export/import.
 */

/** Fit `width`x`height` inside a square of `maxEdge`, preserving aspect ratio.
 *  Returns the original dimensions when already within bounds. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/** Downscale and re-encode an image to a bounded JPEG so stored/uploaded
 *  photos stay small. Falls back to the original file when the browser lacks
 *  the canvas APIs (e.g. SSR/jsdom). */
export async function compressImage(
  file: Blob,
  opts: { maxEdge?: number; quality?: number } = {},
): Promise<Blob> {
  const { maxEdge = 1280, quality = 0.8 } = opts;
  if (typeof createImageBitmap === "undefined") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });

  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  (ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob =
    "convertToBlob" in canvas
      ? await canvas.convertToBlob({ type: "image/jpeg", quality })
      : await new Promise<Blob | null>((resolve) =>
          (canvas as HTMLCanvasElement).toBlob(resolve, "image/jpeg", quality),
        );

  return blob ?? file;
}

/** Encode a Blob as a `data:<mime>;base64,...` URL (no FileReader, so it works
 *  in both the browser and jsdom tests). */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const mime = blob.type || "application/octet-stream";
  return `data:${mime};base64,${btoa(binary)}`;
}

/** Decode a `data:<mime>;base64,...` URL back into a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

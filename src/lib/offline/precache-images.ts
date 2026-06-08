/**
 * The `/_next/image` optimizer URLs referenced in a page's HTML (the `src` and
 * every `srcset` width). Used by the offline precache (#244) to warm a trail's
 * photos so they load offline even on a trail the member never opened: we cache
 * exactly the URLs the page emits, so whichever width the browser later picks is
 * already cached, with no width guessing.
 */
export function extractImageUrls(html: string): string[] {
  // URLs run until the next quote or whitespace; `&` is HTML-encoded as `&amp;`
  // inside attributes, so decode it back to the form the browser will request.
  const matches = html.match(/\/_next\/image\?[^"'\s]+/g) ?? [];
  const decoded = matches.map((url) => url.replace(/&amp;/g, "&"));
  return [...new Set(decoded)];
}

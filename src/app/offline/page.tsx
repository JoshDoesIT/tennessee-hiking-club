import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Offline",
  description: "You are offline.",
  path: "/offline",
  noindex: true,
});

/**
 * Offline fallback (#215). The service worker precaches this page and serves it
 * when a navigation is requested with no signal and nothing cached for it. Pages
 * and maps the member has already opened still load from the cache.
 */
export default function OfflinePage() {
  return (
    <Container className="py-16 text-center sm:py-24">
      <p className="eyebrow text-amber-700">No signal</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        You are offline
      </h1>
      <p className="text-ink/70 mx-auto mt-4 max-w-md leading-relaxed">
        This page has not been saved to your device yet. Reconnect once to load
        it. Trails and maps you have already opened keep working without a
        signal.
      </p>
    </Container>
  );
}

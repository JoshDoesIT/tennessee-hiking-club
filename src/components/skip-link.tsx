/** Keyboard skip link: the first tab stop, jumps past the header to main content. */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="night-panel bg-forest text-cream sr-only z-[100] rounded-full px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
    >
      Skip to content
    </a>
  );
}

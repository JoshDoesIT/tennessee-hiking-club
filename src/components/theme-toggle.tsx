"use client";

/**
 * Light/dark theme toggle (#167). The `.dark` class on <html> is set before
 * paint by the no-flash script in the layout; this control flips it and persists
 * the choice. The icon swaps via CSS (moon by day, sun by night), so there is no
 * React state to hydrate and no flash of the wrong icon.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable; the toggle still works for this session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="border-forest/15 text-forest hover:bg-forest/5 flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
    >
      {/* moon (shown by day, to go dark) */}
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="block dark:hidden"
      >
        <path
          fill="currentColor"
          d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8z"
        />
      </svg>
      {/* sun (shown by night, to go light) */}
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="hidden dark:block"
      >
        <circle cx="12" cy="12" r="4.4" fill="currentColor" />
        <g
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
        </g>
      </svg>
    </button>
  );
}

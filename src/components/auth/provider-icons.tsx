/**
 * Decorative brand marks for the sign-in buttons (#168). Each icon is
 * `aria-hidden` so the button's visible "Continue with X" text stays the
 * accessible label. GitHub and the fallback use `currentColor` (so they follow
 * the button's text colour in light and dark); the Google "G" keeps its
 * official colours. `data-icon` identifies the mark for tests.
 */
const ICON_CLASS = "h-5 w-5 shrink-0";

function GitHubMark() {
  return (
    <svg
      data-icon="github"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={ICON_CLASS}
    >
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.34-1.74-1.34-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.21a11.5 11.5 0 0 1 6 0c2.28-1.53 3.29-1.21 3.29-1.21.66 1.64.24 2.86.12 3.16.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.53-5.49 5.82.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.83.56A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg
      data-icon="google"
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={ICON_CLASS}
    >
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function FallbackMark() {
  return (
    <svg
      data-icon="fallback"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON_CLASS}
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m13.5 9.5 7-7" />
      <path d="m16.5 6.5 2.5 2.5" />
      <path d="m20.5 2.5 2 2" />
    </svg>
  );
}

export function ProviderIcon({ provider }: { provider: string }) {
  switch (provider) {
    case "github":
      return <GitHubMark />;
    case "google":
      return <GoogleMark />;
    default:
      return <FallbackMark />;
  }
}

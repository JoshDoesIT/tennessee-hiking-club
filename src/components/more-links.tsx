import Link from "next/link";

/**
 * Secondary pages for the native app's "More" tab (#250). On the website these
 * live in the header and footer; in the app the bottom tab bar carries the
 * primary destinations and this list keeps everything else reachable.
 */
export const SECONDARY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/leave-no-trace", label: "Leave No Trace" },
  { href: "/credits", label: "Credits" },
  { href: "/privacy", label: "Privacy" },
  { href: "/accessibility", label: "Accessibility" },
] as const;

export function MoreLinks() {
  return (
    <ul className="border-forest/10 divide-forest/10 divide-y rounded-2xl border">
      {SECONDARY_LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-ink hover:bg-forest/5 flex items-center justify-between px-4 py-3.5 text-base font-medium first:rounded-t-2xl last:rounded-b-2xl"
          >
            {link.label}
            <span aria-hidden="true" className="text-pine/40">
              ›
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

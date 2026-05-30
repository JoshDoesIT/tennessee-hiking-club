import Link from "next/link";
import { Logo } from "./logo";
import { FACEBOOK_GROUP_URL } from "@/lib/site";

const REPO = "https://github.com/JoshDoesIT/tennessee-hiking-club";

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <h3 className="text-sage-100 text-xs font-semibold tracking-[0.2em] uppercase">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-cream/75 hover:text-cream text-sm transition-colors"
              {...(l.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-night bg-forest text-cream/90">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo tone="light" size={48} />
          <p className="text-cream/65 max-w-xs text-sm leading-relaxed">
            A community hiking club mapping the Volunteer State&rsquo;s best
            trails, open source and free to explore.
          </p>
        </div>
        <FooterCol
          title="Explore"
          links={[
            { label: "Interactive map", href: "/explore" },
            { label: "All trails", href: "/trails" },
            { label: "Regions", href: "/explore" },
          ]}
        />
        <FooterCol
          title="Community"
          links={[
            { label: "About the club", href: "/about" },
            { label: "Contribute a trail", href: "/contribute" },
            { label: "Leaderboard", href: "/leaderboard" },
            {
              label: "Facebook group",
              href: FACEBOOK_GROUP_URL,
              external: true,
            },
            { label: "Credits", href: "/credits" },
            { label: "Shop (coming soon)", href: "/" },
          ]}
        />
        <FooterCol
          title="Project"
          links={[
            { label: "GitHub", href: REPO, external: true },
            {
              label: "Report an issue",
              href: `${REPO}/issues`,
              external: true,
            },
            { label: "Leave No Trace", href: "/leave-no-trace" },
          ]}
        />
      </div>
      <div className="border-cream/15 border-t">
        <div className="text-cream/55 mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Tennessee Hiking Club · MIT licensed
          </p>
          <nav
            aria-label="Legal and accessibility"
            className="flex flex-wrap gap-x-4 gap-y-1"
          >
            <Link
              href="/privacy"
              className="hover:text-cream transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/accessibility"
              className="hover:text-cream transition-colors"
            >
              Accessibility
            </Link>
            <Link
              href="/leave-no-trace"
              className="hover:text-cream transition-colors"
            >
              Leave No Trace
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useIsNative } from "@/lib/use-is-native";

const ICON = "h-6 w-6";

function ChecklistIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON}
    >
      <path d="M10 6h10" />
      <path d="M10 12h10" />
      <path d="M10 18h10" />
      <path d="m3 5.5 1.4 1.4L7 4.3" />
      <path d="m3 11.5 1.4 1.4L7 10.3" />
      <circle cx="4.4" cy="18" r="1.1" />
    </svg>
  );
}

function SignpostIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON}
    >
      <path d="M12 3v18" />
      <path d="M12 6h6.5l2 2-2 2H12z" />
      <path d="M12 13H5.5l-2 2 2 2H12" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON}
    >
      <path d="M12 21s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function RecordIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={ICON}
    >
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={ICON}
    >
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

type Tab = {
  href: string;
  label: string;
  icon: ReactNode;
  match: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/hikes",
    label: "My Hikes",
    icon: <ChecklistIcon />,
    match: (p) => p === "/hikes",
  },
  {
    href: "/trails",
    label: "Trails",
    icon: <SignpostIcon />,
    match: (p) => p === "/trails" || p.startsWith("/trails/"),
  },
  {
    href: "/explore",
    label: "Map",
    icon: <PinIcon />,
    match: (p) => p === "/explore",
  },
  {
    href: "/record",
    label: "Record",
    icon: <RecordIcon />,
    match: (p) => p === "/record",
  },
  {
    href: "/more",
    label: "More",
    icon: <MoreIcon />,
    match: (p) => p === "/more",
  },
];

/**
 * A native-style bottom tab bar for the Capacitor app (#250), so the app reads
 * as an app rather than the website in a shell. Rendered only on a native
 * build; the website keeps its header/footer navigation. The body gets bottom
 * padding (via `.has-mobile-tabbar` in globals.css) so content clears the bar,
 * and the bar respects the home-indicator safe area.
 */
export function MobileTabBar() {
  const native = useIsNative();
  const pathname = usePathname();

  useEffect(() => {
    if (!native) return;
    // Leave room under page content for the fixed bar (see globals.css).
    document.documentElement.classList.add("has-mobile-tabbar");
    return () => document.documentElement.classList.remove("has-mobile-tabbar");
  }, [native]);

  if (!native) return null;

  return (
    <nav
      aria-label="Primary"
      className="border-forest/12 bg-cream/95 fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="flex">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-forest" : "text-pine/55"
                }`}
              >
                {active ? (
                  <span className="bg-forest absolute inset-x-5 top-0 h-0.5 rounded-full" />
                ) : null}
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

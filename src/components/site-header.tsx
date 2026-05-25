"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./logo";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/trails", label: "Trails" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-forest/10 bg-cream/85 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" aria-label="Tennessee Hiking Club home">
          <Logo size={42} priority />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-forest/80 hover:text-forest text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/explore"
            className="bg-forest text-cream hover:bg-pine rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          >
            Open the map
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation menu"
          className="border-forest/15 text-forest flex h-10 w-10 items-center justify-center rounded-full border md:hidden"
        >
          <span className="sr-only">Menu</span>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            {open ? (
              <path
                d="M3 3l12 12M15 3L3 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M2 5h14M2 9h14M2 13h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-forest/10 bg-cream border-t md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col px-5 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-forest/90 border-forest/5 border-b py-3 text-base font-medium last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

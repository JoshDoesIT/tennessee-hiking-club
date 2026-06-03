"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { buttonVariants } from "./ui/button";
import { AuthControl } from "./auth/auth-control";
import { AdminNavLink } from "./auth/admin-nav-link";
import { ThemeToggle } from "./theme-toggle";
import { useIsNative } from "@/lib/use-is-native";

// "Explore" is intentionally not here: the prominent "Open the map" button is
// the single entry point to the map (#223), on both desktop and the mobile menu.
const NAV = [
  { href: "/trails", label: "Trails" },
  { href: "/hikes", label: "My hikes" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  // On the native app the bottom tab bar is the primary navigation and a "More"
  // tab holds the secondary pages, so the header drops its menu entirely and is
  // just the logo + theme toggle (#250). The website keeps the full menu.
  const native = useIsNative();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    // Move focus into the menu when it opens.
    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="border-forest/10 bg-cream/85 sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] backdrop-blur-md">
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
          <AdminNavLink className="text-sm font-medium text-amber-700 transition-colors hover:text-amber-600" />
          <Link href="/explore" className={buttonVariants({ size: "sm" })}>
            Open the map
          </Link>
          <AuthControl />
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {native ? null : (
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
              className="border-forest/15 text-forest flex h-10 w-10 items-center justify-center rounded-full border md:hidden"
            >
              <span className="sr-only">Menu</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
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
          )}
        </div>
      </div>

      {open && !native ? (
        <nav
          ref={menuRef}
          id="mobile-nav"
          aria-label="Mobile"
          className="border-forest/10 bg-cream border-t md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col px-5 py-3">
            <Link
              href="/explore"
              onClick={() => setOpen(false)}
              className={`${buttonVariants({ size: "sm" })} mb-3 w-full justify-center`}
            >
              Open the map
            </Link>
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
            <AdminNavLink
              className="border-forest/5 border-b py-3 text-base font-medium text-amber-700"
              onNavigate={() => setOpen(false)}
            />
            <div className="pt-3">
              <AuthControl />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

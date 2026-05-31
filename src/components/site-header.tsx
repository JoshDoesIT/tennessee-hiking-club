"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { buttonVariants } from "./ui/button";
import { AuthControl } from "./auth/auth-control";
import { AdminNavLink } from "./auth/admin-nav-link";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/trails", label: "Trails" },
  { href: "/hikes", label: "My hikes" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
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
          <AdminNavLink className="text-amber-700 hover:text-amber-600 text-sm font-medium transition-colors" />
          <Link href="/explore" className={buttonVariants({ size: "sm" })}>
            Open the map
          </Link>
          <AuthControl />
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
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
      </div>

      {open ? (
        <nav
          ref={menuRef}
          id="mobile-nav"
          aria-label="Mobile"
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
            <AdminNavLink
              className="text-amber-700 border-forest/5 border-b py-3 text-base font-medium"
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

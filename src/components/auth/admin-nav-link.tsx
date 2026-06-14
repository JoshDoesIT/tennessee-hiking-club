"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useIsNative } from "@/lib/use-is-native";
import { API_ORIGIN } from "@/lib/api-origin";

const ADMIN_PATH = "/admin/submissions";

/**
 * A maintainer-only link to the review queue. Asks `/api/admin/status` whether
 * the session is an admin and renders the link only if so. This is purely
 * cosmetic: the admin pages enforce access server-side, so the link never
 * grants anything on its own.
 *
 * The admin pages are web-only: they are `force-dynamic` and excluded from the
 * native app bundle (`scripts/build-capacitor.mjs`). Inside the app an in-bundle
 * link to `/admin/submissions` does not exist and dead-ends on the home page, so
 * there the control opens the production review queue in the system browser
 * instead (the same pattern as native sign-in and shared links).
 */
export function AdminNavLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const native = useIsNative();

  useEffect(() => {
    let active = true;
    fetch("/api/admin/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.isAdmin) setIsAdmin(true);
      })
      .catch(() => {
        /* not an admin / not signed in */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) return null;

  if (native) {
    return (
      <button
        type="button"
        className={className}
        onClick={async () => {
          onNavigate?.();
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: `${API_ORIGIN}${ADMIN_PATH}` });
        }}
      >
        Review queue
      </button>
    );
  }

  return (
    <Link href={ADMIN_PATH} onClick={onNavigate} className={className}>
      Review queue
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * A maintainer-only link to the review queue. Asks `/api/admin/status` whether
 * the session is an admin and renders the link only if so. This is purely
 * cosmetic: the admin pages enforce access server-side, so the link never
 * grants anything on its own.
 */
export function AdminNavLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <Link href="/admin/submissions" onClick={onNavigate} className={className}>
      Review queue
    </Link>
  );
}

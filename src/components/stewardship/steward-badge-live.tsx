"use client";

import { useEffect, useState } from "react";
import { StewardBadge } from "./steward-badge";

/**
 * Fetches the signed-in member's contribution count client-side and renders the
 * Trail Steward badge, so the account page can be a static export (#308). The
 * badge also shows for the Leave No Trace pledge (handled inside StewardBadge),
 * which works signed-out and offline; the contribution count just adds the other
 * way to earn it.
 */
export function StewardBadgeLive() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/contributions/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data && typeof data.count === "number") {
          setCount(data.count);
        }
      })
      .catch(() => {
        /* offline or no backend: the pledge still earns the badge */
      });
    return () => {
      active = false;
    };
  }, []);

  return <StewardBadge contributionCount={count} />;
}

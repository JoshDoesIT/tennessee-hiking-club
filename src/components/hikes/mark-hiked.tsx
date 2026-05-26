"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
  addHike,
  removeTrail,
} from "@/lib/hikes/local-log";

/** Local-first "mark as hiked" toggle for a trail. Reads the browser-stored
 *  log via useSyncExternalStore (SSR-safe, no hydration flag) and persists with
 *  no account required. */
export function MarkHiked({ slug }: { slug: string }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );
  const hiked = log.some((e) => e.trailSlug === slug);

  return (
    <Button
      variant={hiked ? "primary" : "outline"}
      aria-pressed={hiked}
      onClick={() => {
        if (hiked) {
          removeTrail(slug);
        } else {
          addHike(slug, new Date().toISOString().slice(0, 10));
        }
      }}
    >
      {hiked ? "Hiked" : "Mark as hiked"}
    </Button>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  subscribe,
  getCleanupsSnapshot,
  getServerCleanupsSnapshot,
  logCleanup,
} from "@/lib/stewardship/cleanups";

/** Log a trail cleanup (pack-it-out / litter pickup) and show the running
 *  count. Local-first, so it works without an account. */
export function CleanupLog() {
  const cleanups = useSyncExternalStore(
    subscribe,
    getCleanupsSnapshot,
    getServerCleanupsSnapshot,
  );
  const count = cleanups.length;

  return (
    <div className="border-forest/10 bg-cream-50 rounded-2xl border p-5">
      <p className="text-forest font-semibold">Logged a cleanup?</p>
      <p className="text-ink/70 mt-1 text-sm leading-relaxed">
        Packed out litter or joined a cleanup? Log it to track your stewardship
        over time.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => logCleanup(new Date().toISOString().slice(0, 10))}
        >
          Log a cleanup
        </Button>
        {count > 0 ? (
          <span className="text-pine text-sm font-medium">
            {count} cleanup{count === 1 ? "" : "s"} logged
          </span>
        ) : null}
      </div>
    </div>
  );
}

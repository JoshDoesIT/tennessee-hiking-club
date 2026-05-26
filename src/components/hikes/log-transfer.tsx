"use client";

import { useId, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
} from "@/lib/hikes/local-log";
import {
  exportLogJson,
  exportLogGpx,
  importLogJson,
} from "@/lib/hikes/transfer";
import type { Trail } from "@/lib/trails/schema";

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export and import the local hike log. Local-first escape hatch: back the log
 * up or carry it to another device before accounts and sync exist. Import
 * merges, so it never silently wipes existing hikes.
 */
export function LogTransfer({ trails }: { trails: Trail[] }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );
  const [status, setStatus] = useState("");
  const inputId = useId();

  async function onImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be chosen again
    if (!file) return;
    try {
      const next = importLogJson(await file.text(), "merge");
      const n = next.length;
      setStatus(`Imported. You now have ${n} hike${n === 1 ? "" : "s"} logged.`);
    } catch {
      setStatus(
        "Could not read that file. Export a JSON file from this page to see the expected format.",
      );
    }
  }

  return (
    <section
      aria-labelledby="data-heading"
      className="border-forest/10 mt-12 border-t pt-8"
    >
      <h2 id="data-heading" className="display text-forest text-2xl">
        Your data
      </h2>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        Your hikes are kept on this device. Back them up or move them to another
        device. Importing adds to what you already have.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            download(
              "tennessee-hikes.json",
              exportLogJson(log),
              "application/json",
            )
          }
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() =>
            download(
              "tennessee-hikes.gpx",
              exportLogGpx(log, trails),
              "application/gpx+xml",
            )
          }
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Export GPX
        </button>
        <label
          htmlFor={inputId}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "cursor-pointer",
          )}
        >
          Import JSON
        </label>
        <input
          id={inputId}
          type="file"
          accept="application/json,.json"
          onChange={onImport}
          className="sr-only"
        />
      </div>

      <p
        role="status"
        aria-live="polite"
        className="text-pine mt-3 min-h-5 text-sm"
      >
        {status}
      </p>
    </section>
  );
}

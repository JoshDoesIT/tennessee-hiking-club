"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  subscribe,
  getLogSnapshot,
  getServerLogSnapshot,
} from "@/lib/hikes/local-log";
import { myTennesseeShareUrl } from "@/lib/share/my-tennessee";

/**
 * "Share my Tennessee" control on the My hikes page. Builds a public URL from
 * the local hike log and copies it to the clipboard. Renders nothing until at
 * least one trail is logged; sharing is opt-in by virtue of the user choosing
 * to copy and paste the link.
 */
export function ShareMyTennessee({ origin }: { origin: string }) {
  const log = useSyncExternalStore(
    subscribe,
    getLogSnapshot,
    getServerLogSnapshot,
  );
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const slugs = [...new Set(log.map((e) => e.trailSlug))];
  const url = myTennesseeShareUrl(slugs, origin);

  if (!url) return null;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <section aria-labelledby="share-my-tennessee-heading">
      <h3
        id="share-my-tennessee-heading"
        className="text-forest text-base font-semibold"
      >
        Share your Tennessee
      </h3>
      <p className="text-ink/70 mt-1 text-sm leading-relaxed">
        Generate a public link to your map with this trail list. Anyone with
        the link can see it; nothing is shared until you copy and send it.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          Copy share link
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status === "copied"
            ? "Link copied!"
            : status === "error"
              ? "Could not copy"
              : ""}
        </span>
      </div>
    </section>
  );
}

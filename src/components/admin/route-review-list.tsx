"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type PendingRoute = {
  id: string;
  trailSlug: string;
  trailName: string;
  /** Track name from the GPX, if any. */
  name: string | null;
  pointCount: number;
  lengthMiles: number;
  gainFt: number;
  submittedBy: string;
  submittedOn: string;
  /** The `route:` front-matter block to paste into the trail (#201). */
  entry: { yaml: string };
};

type Decision = "approved" | "rejected";

/**
 * Maintainer review queue for contributed hike tracks (#201). Approve or reject
 * each pending GPX a member recorded; approving credits the submitter and
 * reveals the `route:` front-matter to curate into the trail. Tracks are never
 * auto-published; a maintainer pastes the reviewed block into the content (and
 * runs `pnpm enrich:elevation` if any points lack elevation).
 */
export function RouteReviewList({
  contributions,
}: {
  contributions: PendingRoute[];
}) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (contributions.length === 0) {
    return (
      <p className="border-forest/15 text-ink/70 mt-6 rounded-2xl border border-dashed p-10 text-center">
        No recorded routes to review right now.
      </p>
    );
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/contributions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type: "route" }),
      });
      if (res.ok) {
        setDecisions((prev) => ({
          ...prev,
          [id]: action === "approve" ? "approved" : "rejected",
        }));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="mt-6 space-y-4">
      {contributions.map((c) => {
        const decided = decisions[c.id];
        return (
          <li
            key={c.id}
            className="border-forest/10 bg-cream-50 rounded-2xl border p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-forest text-lg font-semibold">
                {c.trailName}
              </h2>
              <span className="text-ink/70 text-xs">
                {c.submittedBy} · {c.submittedOn}
              </span>
            </div>
            {c.name && (
              <p className="text-olive mt-1 text-sm font-medium">{c.name}</p>
            )}
            <p className="text-ink/70 mt-1 text-sm">
              {c.lengthMiles.toFixed(1)} mi · {c.gainFt.toLocaleString()} ft
              gain · {c.pointCount.toLocaleString()} points
            </p>

            {decided ? (
              <div className="mt-4">
                <p className="text-pine text-sm font-medium" role="status">
                  Marked {decided}.
                </p>
                {decided === "approved" && (
                  <div className="border-forest/15 mt-3 rounded-xl border p-4">
                    <p className="text-forest text-sm font-medium">
                      Replace the <code className="text-ink/80">route:</code>{" "}
                      block in{" "}
                      <code className="text-ink/80">
                        content/trails/{c.trailSlug}.md
                      </code>{" "}
                      (and credit {c.submittedBy} in{" "}
                      <code className="text-ink/80">contributors:</code>)
                    </p>
                    <pre className="border-forest/10 text-ink/80 bg-cream-50 mt-3 overflow-x-auto rounded-lg border p-3 text-xs">
                      {c.entry.yaml}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={busy === c.id}
                  aria-label={`Approve route for ${c.trailName}`}
                  onClick={() => review(c.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === c.id}
                  aria-label={`Reject route for ${c.trailName}`}
                  onClick={() => review(c.id, "reject")}
                >
                  Reject
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

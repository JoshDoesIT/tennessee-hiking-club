"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type PendingWaypoint = {
  id: string;
  trailSlug: string;
  trailName: string;
  name: string;
  type: string;
  description?: string | null;
  lat: number;
  lng: number;
  hasPhoto: boolean;
  submittedBy: string;
  submittedOn: string;
  /** The `waypoints[]` YAML entry to paste into the trail (#191). */
  entry: { yaml: string; valid: boolean };
};

type Decision = "approved" | "rejected";

/**
 * Maintainer review queue for "Suggest a landmark" submissions (#191). Approve or
 * reject each pending suggestion; approving credits the submitter and reveals the
 * `waypoints[]` YAML entry to curate into the trail. Suggestions are never
 * auto-published; a maintainer pastes the reviewed entry into the content.
 */
export function WaypointReviewList({
  suggestions,
}: {
  suggestions: PendingWaypoint[];
}) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (suggestions.length === 0) {
    return (
      <p className="border-forest/15 text-ink/70 mt-6 rounded-2xl border border-dashed p-10 text-center">
        No landmark suggestions to review right now.
      </p>
    );
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/contributions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type: "waypoint" }),
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
      {suggestions.map((s) => {
        const decided = decisions[s.id];
        return (
          <li
            key={s.id}
            className="border-forest/10 bg-cream-50 rounded-2xl border p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-forest text-lg font-semibold">
                {s.trailName}
              </h2>
              <span className="text-ink/70 text-xs">
                {s.submittedBy} · {s.submittedOn}
              </span>
            </div>
            <p className="text-olive mt-1 text-sm font-medium">
              {s.name}{" "}
              <span className="text-ink/60 text-xs tracking-wider uppercase">
                · {s.type}
              </span>
            </p>
            <p className="text-ink/60 mt-0.5 text-xs">
              {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
            </p>
            {s.description && (
              <p className="text-ink/80 mt-1 text-sm italic">
                &ldquo;{s.description}&rdquo;
              </p>
            )}
            {s.hasPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/contributions/waypoint/${s.id}/photo/view`}
                alt={`Photo suggested for ${s.name}`}
                className="border-forest/10 mt-3 max-h-64 w-full rounded-lg border object-cover"
              />
            )}

            {decided ? (
              <div className="mt-4">
                <p className="text-pine text-sm font-medium" role="status">
                  Marked {decided}.
                </p>
                {decided === "approved" && (
                  <div className="border-forest/15 mt-3 rounded-xl border p-4">
                    <p className="text-forest text-sm font-medium">
                      Add under <code className="text-ink/80">waypoints:</code>{" "}
                      in{" "}
                      <code className="text-ink/80">
                        content/trails/{s.trailSlug}.md
                      </code>{" "}
                      (and credit {s.submittedBy} in{" "}
                      <code className="text-ink/80">contributors:</code>)
                    </p>
                    <pre className="border-forest/10 text-ink/80 mt-3 overflow-x-auto rounded-lg border bg-cream-50 p-3 text-xs">
                      {s.entry.yaml}
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
                  disabled={busy === s.id}
                  aria-label={`Approve suggestion for ${s.trailName}`}
                  onClick={() => review(s.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === s.id}
                  aria-label={`Reject suggestion for ${s.trailName}`}
                  onClick={() => review(s.id, "reject")}
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

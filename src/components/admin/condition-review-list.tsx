"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type PendingConditionReport = {
  id: string;
  trailSlug: string;
  trailName: string;
  status: string;
  note?: string | null;
  reportDate: string;
  submittedBy: string;
  submittedOn: string;
  /** The `conditionReports[]` YAML entry to paste into the trail (#149/#150). */
  entry: { yaml: string; valid: boolean };
};

type Decision = "approved" | "rejected";

/**
 * Maintainer review queue for in-app condition reports (#149). Approve or reject
 * each pending report; approving credits the submitter on the conditions board.
 * On approval the YAML entry to paste into the trail's `conditionReports[]` is
 * revealed; curating it into the content stays a reviewed step.
 */
export function ConditionReviewList({
  reports,
}: {
  reports: PendingConditionReport[];
}) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (reports.length === 0) {
    return (
      <p className="border-forest/15 text-ink/70 mt-6 rounded-2xl border border-dashed p-10 text-center">
        No condition reports to review right now.
      </p>
    );
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/contributions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type: "condition" }),
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
      {reports.map((r) => {
        const decided = decisions[r.id];
        return (
          <li
            key={r.id}
            className="border-forest/10 bg-cream-50 rounded-2xl border p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-forest text-lg font-semibold">
                {r.trailName}
              </h2>
              <span className="text-ink/70 text-xs">
                {r.submittedBy} · {r.submittedOn}
              </span>
            </div>
            <p className="text-olive mt-1 text-sm font-medium">{r.status}</p>
            {r.note && (
              <p className="text-ink/80 mt-1 text-sm italic">
                &ldquo;{r.note}&rdquo;
              </p>
            )}

            {decided ? (
              <div className="mt-4">
                <p className="text-pine text-sm font-medium" role="status">
                  Marked {decided}.
                </p>
                {decided === "approved" && (
                  <div className="border-forest/15 mt-3 rounded-xl border p-4">
                    <p className="text-forest text-sm font-medium">
                      Add under <code className="text-ink/80">conditionReports:</code>{" "}
                      in{" "}
                      <code className="text-ink/80">
                        content/trails/{r.trailSlug}.md
                      </code>
                    </p>
                    <pre className="border-forest/10 text-ink/80 mt-3 overflow-x-auto rounded-lg border bg-white p-3 text-xs">
                      {r.entry.yaml}
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
                  disabled={busy === r.id}
                  aria-label={`Approve report for ${r.trailName}`}
                  onClick={() => review(r.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === r.id}
                  aria-label={`Reject report for ${r.trailName}`}
                  onClick={() => review(r.id, "reject")}
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

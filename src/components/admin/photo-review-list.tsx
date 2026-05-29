"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type PendingPhoto = {
  id: string;
  trailSlug: string;
  trailName: string;
  alt: string;
  credit?: string | null;
  submittedBy: string;
  submittedOn: string;
};

type Decision = "approved" | "rejected";

const viewUrl = (id: string) => `/api/contributions/photo/${id}/view`;

/**
 * Maintainer review queue for in-app photo submissions (#149). The private image
 * is previewed through an admin-gated proxy. Approving credits the submitter on
 * the photo-credits board; the maintainer then downloads the image and adds it
 * to the trail's `photos[]` (auto-publish is tracked in #157).
 */
export function PhotoReviewList({ photos }: { photos: PendingPhoto[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <p className="border-forest/15 text-ink/70 mt-6 rounded-2xl border border-dashed p-10 text-center">
        No photos to review right now.
      </p>
    );
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/contributions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type: "photo" }),
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
      {photos.map((p) => {
        const decided = decisions[p.id];
        return (
          <li
            key={p.id}
            className="border-forest/10 bg-cream-50 rounded-2xl border p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-forest text-lg font-semibold">
                {p.trailName}
              </h2>
              <span className="text-ink/70 text-xs">
                {p.submittedBy} · {p.submittedOn}
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- private Blob proxy, not a static asset */}
            <img
              src={viewUrl(p.id)}
              alt={p.alt}
              className="border-forest/10 mt-3 max-h-64 w-full rounded-lg border object-cover"
            />
            <p className="text-ink/70 mt-2 text-sm">{p.alt}</p>
            {p.credit && (
              <p className="text-ink/60 mt-1 text-xs">{p.credit}</p>
            )}

            {decided ? (
              <div className="mt-4">
                <p className="text-pine text-sm font-medium" role="status">
                  Marked {decided}.
                </p>
                {decided === "approved" && (
                  <p className="text-ink/80 mt-2 text-sm">
                    <a
                      href={viewUrl(p.id)}
                      download
                      className="text-pine hover:text-forest underline underline-offset-4"
                    >
                      Download the photo
                    </a>{" "}
                    and add it to{" "}
                    <code className="text-ink/80">
                      content/trails/{p.trailSlug}.md
                    </code>{" "}
                    under <code className="text-ink/80">photos:</code>.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={busy === p.id}
                  aria-label={`Approve photo for ${p.trailName}`}
                  onClick={() => review(p.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === p.id}
                  aria-label={`Reject photo for ${p.trailName}`}
                  onClick={() => review(p.id, "reject")}
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type PendingSubmission = {
  id: string;
  name: string;
  region: string;
  area: string;
  lat: number;
  lng: number;
  description: string;
  lengthMiles?: number | null;
  elevationGainFt?: number | null;
  difficulty?: string | null;
  routeType?: string | null;
  links?: string | null;
  /** Number of photos the contributor attached (#29), shown via the view route. */
  photoCount?: number;
  submittedBy: string;
  submittedOn: string;
  /** The `content/trails/<slug>.md` generated from this submission (#150). */
  generated: {
    fileName: string;
    markdown: string;
    valid: boolean;
    missing: string[];
  };
};

type Decision = "approved" | "rejected";

/** Download generated markdown as a file the maintainer can commit. */
function downloadFile(fileName: string, markdown: string) {
  if (typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Maintainer review queue for in-app trail submissions (#146). Approve or reject
 * each pending proposal; the decision is recorded via the review route. Approving
 * credits the submitter; the maintainer then adds the trail content file (the
 * curated publish step) separately.
 */
export function SubmissionReviewList({
  submissions,
}: {
  submissions: PendingSubmission[];
}) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [prUrls, setPrUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (submissions.length === 0) {
    return (
      <p className="border-forest/15 text-ink/70 mt-6 rounded-2xl border border-dashed p-10 text-center">
        Nothing to review right now.
      </p>
    );
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/contributions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setDecisions((prev) => ({
          ...prev,
          [id]: action === "approve" ? "approved" : "rejected",
        }));
        const data = await res.json().catch(() => null);
        if (data?.prUrl) {
          setPrUrls((prev) => ({ ...prev, [id]: data.prUrl as string }));
        }
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="mt-6 space-y-4">
      {submissions.map((s) => {
        const decided = decisions[s.id];
        return (
          <li
            key={s.id}
            className="border-forest/10 bg-cream-50 rounded-2xl border p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-forest text-lg font-semibold">{s.name}</h2>
              <span className="text-ink/70 text-xs">
                {s.submittedBy} · {s.submittedOn}
              </span>
            </div>
            <p className="text-ink/70 mt-1 text-sm">
              {s.region} Tennessee · {s.area} · {s.lat.toFixed(4)},{" "}
              {s.lng.toFixed(4)}
            </p>
            <p className="text-ink/80 mt-2 text-sm leading-relaxed">
              {s.description}
            </p>
            {(s.lengthMiles || s.elevationGainFt || s.difficulty || s.routeType) && (
              <p className="text-ink/70 mt-2 text-xs">
                {[
                  s.lengthMiles ? `${s.lengthMiles} mi` : null,
                  s.elevationGainFt ? `${s.elevationGainFt} ft gain` : null,
                  s.difficulty,
                  s.routeType,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {s.links && (
              <p className="mt-2 text-xs">
                <a
                  href={s.links}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pine hover:text-forest underline underline-offset-4"
                >
                  {s.links}
                </a>
              </p>
            )}

            {s.photoCount ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: s.photoCount }).map((_, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- private Blob proxy, not a static asset
                  <img
                    key={i}
                    src={`/api/contributions/trail/${s.id}/photo/${i}/view`}
                    alt={`Photo ${i + 1} submitted for ${s.name}`}
                    className="border-forest/15 h-24 w-24 rounded-lg border object-cover"
                  />
                ))}
              </div>
            ) : null}

            {decided ? (
              <div className="mt-4">
                <p className="text-pine text-sm font-medium" role="status">
                  Marked {decided}.
                </p>
                {decided === "approved" &&
                  (prUrls[s.id] ? (
                    <p className="text-ink/80 mt-3 text-sm">
                      Opened a{" "}
                      <a
                        href={prUrls[s.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pine hover:text-forest underline underline-offset-4"
                      >
                        pull request
                      </a>{" "}
                      to publish this trail. Merge it to go live.
                    </p>
                  ) : (
                    <div className="border-forest/15 mt-3 rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-forest text-sm font-medium">
                          Content file:{" "}
                          <code className="text-ink/80">
                            content/trails/{s.generated.fileName}
                          </code>
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Download ${s.generated.fileName}`}
                          onClick={() =>
                            downloadFile(
                              s.generated.fileName,
                              s.generated.markdown,
                            )
                          }
                        >
                          Download file
                        </Button>
                      </div>
                      {!s.generated.valid && (
                        <p className="text-amber-700 mt-2 text-xs" role="note">
                          Fill in before committing:{" "}
                          {s.generated.missing.join(", ")}
                        </p>
                      )}
                      <pre className="border-forest/10 text-ink/80 mt-3 overflow-x-auto rounded-lg border bg-cream-50 p-3 text-xs">
                        {s.generated.markdown}
                      </pre>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={busy === s.id}
                  aria-label={`Approve ${s.name}`}
                  onClick={() => review(s.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === s.id}
                  aria-label={`Reject ${s.name}`}
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

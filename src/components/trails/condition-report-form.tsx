"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

/**
 * In-app condition report (#149) for an existing trail. A signed-in member
 * reports current conditions without git; the report is a reviewed proposal,
 * recorded against their account and curated into the trail by a maintainer.
 * Renders nothing for signed-out visitors (the GitHub issue link in
 * `TrailConditions` remains their path). Gates on `/api/auth/session` so the
 * POST never 401s.
 */
const fieldClass =
  "border-forest/20 text-ink w-full rounded-lg border bg-white px-3 py-2 text-sm";
const labelClass = "text-olive text-xs font-semibold tracking-wider uppercase";

export function ConditionReportForm({
  trailSlug,
  trailName,
}: {
  trailSlug: string;
  trailName: string;
}) {
  const [state, setState] = useState<"loading" | "anon" | "ready">("loading");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await (await fetch("/api/auth/session")).json();
        if (active) setState(session?.user ? "ready" : "anon");
      } catch {
        if (active) setState("anon");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state !== "ready") return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      trailSlug,
      status: String(data.get("status") ?? "").trim(),
      note: String(data.get("note") ?? "").trim() || undefined,
    };

    setSubmitting(true);
    setStatus("Submitting…");
    try {
      const res = await fetch("/api/contributions/condition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("Thanks. Your report is in the queue for review.");
        form.reset();
      } else {
        setStatus("Could not submit. Add a condition and try again.");
      }
    } catch {
      setStatus("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-forest/10 bg-cream-50 mt-4 grid gap-3 rounded-xl border p-4"
      aria-label={`Report conditions for ${trailName}`}
      noValidate
    >
      <p className="text-forest text-sm font-medium">
        Hiked it lately? Report current conditions
      </p>
      <div className="grid gap-1">
        <label htmlFor="cond-status" className={labelClass}>
          Condition
        </label>
        <input
          id="cond-status"
          name="status"
          required
          maxLength={80}
          placeholder="e.g. Muddy, bridge out, trail clear"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="cond-note" className={labelClass}>
          Note (optional)
        </label>
        <textarea
          id="cond-note"
          name="note"
          rows={2}
          maxLength={280}
          placeholder="Anything else worth knowing right now?"
          className={fieldClass}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={submitting}>
          Report conditions
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>
    </form>
  );
}

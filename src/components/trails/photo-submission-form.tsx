"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

/**
 * In-app photo submission (#149) for an existing trail. A signed-in member adds
 * a photo without git; the image is stored privately and reviewed before a
 * maintainer curates it into the trail's `photos[]`. Alt text is required for
 * accessibility, and the member must affirm they have the right to share it.
 * Renders nothing for signed-out visitors; gates on `/api/auth/session`.
 */
const fieldClass =
  "border-forest/20 text-ink w-full rounded-lg border bg-cream-50 px-3 py-2 text-sm";
const labelClass = "text-olive text-xs font-semibold tracking-wider uppercase";

export function PhotoSubmissionForm({
  trailSlug,
  trailName,
}: {
  trailSlug: string;
  trailName: string;
}) {
  const [state, setState] = useState<"loading" | "anon" | "ready">("loading");
  const [consent, setConsent] = useState(false);
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
    data.set("trailSlug", trailSlug);

    setSubmitting(true);
    setStatus("Uploading…");
    try {
      const res = await fetch("/api/contributions/photo", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setStatus("Thanks. Your photo is in the queue for review.");
        form.reset();
        setConsent(false);
      } else if (res.status === 503) {
        setStatus("Photo uploads are not available right now.");
      } else {
        setStatus("Could not submit. Check the photo and description.");
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
      aria-label={`Add a photo for ${trailName}`}
      noValidate
    >
      <p className="text-forest text-sm font-medium">Add a photo</p>
      <div className="grid gap-1">
        <label htmlFor="photo-file" className={labelClass}>
          Choose a photo
        </label>
        <input
          id="photo-file"
          name="file"
          type="file"
          accept="image/*"
          required
          className={fieldClass}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="photo-alt" className={labelClass}>
          Describe the photo (alt text)
        </label>
        <input
          id="photo-alt"
          name="alt"
          required
          maxLength={200}
          placeholder="What's in the photo, for screen readers"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="photo-credit" className={labelClass}>
          Credit (optional)
        </label>
        <input
          id="photo-credit"
          name="credit"
          maxLength={200}
          placeholder="How you'd like to be credited"
          className={fieldClass}
        />
      </div>
      <label className="text-ink/80 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="accent-forest mt-0.5 h-4 w-4"
        />
        I have the right to share this photo and agree it may be published on
        the trail page.
      </label>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={submitting || !consent}
        >
          Add photo
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PhotoPreviews } from "@/components/ui/photo-previews";

/**
 * In-app photo submission (#149, #358) for an existing trail. A signed-in member
 * adds one or more photos without git; each image is stored privately and
 * reviewed before a maintainer curates it into the trail's `photos[]`. Every
 * photo needs its own alt text for accessibility, and the member must affirm
 * they have the right to share them. Each photo is posted separately to the
 * per-photo contribution endpoint. Renders nothing for signed-out visitors;
 * gates on `/api/auth/session`.
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
  const [files, setFiles] = useState<File[]>([]);
  const [alts, setAlts] = useState<string[]>([]);
  const [credit, setCredit] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stable single-file arrays so each row's async preview is not rebuilt on
  // every render (PhotoPreviews keys its object URLs on the array reference).
  const previewArrays = useMemo(() => files.map((f) => [f]), [files]);

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

  function pickFiles(picked: File[]) {
    setFiles(picked);
    setAlts(picked.map(() => ""));
  }

  function resetForm() {
    setFiles([]);
    setAlts([]);
    setCredit("");
    setConsent(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setStatus("Choose at least one photo.");
      return;
    }
    if (alts.some((a) => !a.trim())) {
      setStatus("Add a description for each photo.");
      return;
    }

    setSubmitting(true);
    const total = files.length;
    setStatus(`Uploading ${total} photo${total > 1 ? "s" : ""}…`);
    let ok = 0;
    let unavailable = false;
    try {
      for (let i = 0; i < files.length; i++) {
        const data = new FormData();
        data.set("trailSlug", trailSlug);
        data.set("file", files[i]);
        data.set("alt", alts[i].trim());
        if (credit.trim()) data.set("credit", credit.trim());
        const res = await fetch("/api/contributions/photo", {
          method: "POST",
          body: data,
        });
        if (res.ok) ok++;
        else if (res.status === 503) {
          unavailable = true;
          break;
        }
      }
    } catch {
      /* handled by the counts below */
    } finally {
      setSubmitting(false);
    }

    if (unavailable) {
      setStatus("Photo uploads are not available right now.");
    } else if (ok === total) {
      setStatus(
        `Thanks. ${ok} photo${ok > 1 ? "s are" : " is"} in the queue for review.`,
      );
      resetForm();
    } else if (ok > 0) {
      setStatus(`Added ${ok} of ${total}. Please try the rest again.`);
    } else {
      setStatus("Could not submit. Check the photos and try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-forest/10 bg-cream-50 mt-4 grid gap-3 rounded-xl border p-4"
      aria-label={`Add photos for ${trailName}`}
      noValidate
    >
      <p className="text-forest text-sm font-medium">Add photos</p>
      <div className="grid gap-1">
        <label htmlFor="photo-files" className={labelClass}>
          Choose photos
        </label>
        <input
          id="photo-files"
          ref={fileInputRef}
          name="file"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            pickFiles(e.target.files ? Array.from(e.target.files) : [])
          }
          className={fieldClass}
        />
        <p className="text-ink/60 text-xs">
          You can add several at once. Each needs a short description.
        </p>
      </div>

      {files.length > 0 ? (
        <ul className="grid gap-3">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className="border-forest/10 grid gap-1 rounded-lg border p-3"
            >
              <PhotoPreviews files={previewArrays[i]} />
              <label htmlFor={`photo-alt-${i}`} className={labelClass}>
                Describe photo {i + 1} (alt text)
              </label>
              <input
                id={`photo-alt-${i}`}
                value={alts[i] ?? ""}
                onChange={(e) =>
                  setAlts((prev) =>
                    prev.map((a, j) => (j === i ? e.target.value : a)),
                  )
                }
                maxLength={200}
                placeholder="What's in the photo, for screen readers"
                className={fieldClass}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-1">
        <label htmlFor="photo-credit" className={labelClass}>
          Credit (optional)
        </label>
        <input
          id="photo-credit"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
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
        I have the right to share {files.length > 1 ? "these photos" : "this photo"}{" "}
        and agree they may be published on the trail page.
      </label>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={submitting || !consent || files.length === 0}
        >
          {files.length > 1 ? "Add photos" : "Add photo"}
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>
    </form>
  );
}

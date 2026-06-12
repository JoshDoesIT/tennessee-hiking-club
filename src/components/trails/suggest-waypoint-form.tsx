"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { WAYPOINT_TYPES } from "@/lib/trails/schema";
import { WAYPOINT_LABEL } from "./waypoint-style";

const fieldClass =
  "border-forest/20 text-ink w-full rounded-lg border bg-cream-50 px-3 py-2 text-sm";
const labelClass = "text-olive text-xs font-semibold tracking-wider uppercase";

/**
 * "Suggest a landmark" (#191): a signed-in member proposes a waypoint on an
 * existing trail (coordinate + name + type + optional description and photo).
 * Mirrors the photo/condition contribution forms: gated on sign-in, posts as
 * multipart form-data, and lands in the admin review queue. Renders nothing for
 * signed-out visitors.
 */
export function SuggestWaypointForm({
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
    data.set("trailSlug", trailSlug);

    setSubmitting(true);
    setStatus("Submitting…");
    try {
      const res = await fetch("/api/contributions/waypoint", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setStatus("Thanks. Your landmark is in the queue for review.");
        form.reset();
      } else if (res.status === 503) {
        setStatus("Photo uploads are not available right now.");
      } else {
        setStatus("Could not submit. Check the name, type, and coordinates.");
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
      aria-label={`Suggest a landmark for ${trailName}`}
      noValidate
    >
      <p className="text-forest text-sm font-medium">
        Spotted something worth marking? Suggest a landmark
      </p>

      <div className="grid gap-1">
        <label htmlFor="wp-name" className={labelClass}>
          Landmark name
        </label>
        <input
          id="wp-name"
          name="name"
          required
          maxLength={80}
          placeholder="e.g. Big Branch Falls"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="wp-type" className={labelClass}>
          Landmark type
        </label>
        <select id="wp-type" name="type" required defaultValue="" className={fieldClass}>
          <option value="" disabled>
            Choose a type
          </option>
          {WAYPOINT_TYPES.map((t) => (
            <option key={t} value={t}>
              {WAYPOINT_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label htmlFor="wp-lat" className={labelClass}>
            Latitude
          </label>
          <input
            id="wp-lat"
            name="lat"
            type="number"
            step="any"
            required
            placeholder="35.83"
            className={fieldClass}
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="wp-lng" className={labelClass}>
            Longitude
          </label>
          <input
            id="wp-lng"
            name="lng"
            type="number"
            step="any"
            required
            placeholder="-85.29"
            className={fieldClass}
          />
        </div>
      </div>
      <p className="text-ink/60 text-xs">
        Tip: long-press the spot in Google Maps to copy its coordinates.
      </p>

      <div className="grid gap-1">
        <label htmlFor="wp-description" className={labelClass}>
          Description (optional)
        </label>
        <textarea
          id="wp-description"
          name="description"
          rows={2}
          maxLength={280}
          placeholder="What makes it worth a stop?"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="wp-photo" className={labelClass}>
          Photo (optional)
        </label>
        <input
          id="wp-photo"
          name="photo"
          type="file"
          accept="image/*"
          className={fieldClass}
        />
        <p className="text-ink/60 text-xs">
          Only attach a photo you have the right to share.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={submitting}>
          Suggest a landmark
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>
    </form>
  );
}

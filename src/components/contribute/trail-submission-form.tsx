"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SignInOptions } from "@/components/auth/sign-in-options";
import { PasskeyButton } from "@/components/auth/passkey-button";
import { REGIONS, DIFFICULTIES, ROUTE_TYPES } from "@/lib/trails/schema";

/**
 * In-app new-trail submission (#146). Any signed-in member can propose a trail
 * without git; the proposal is stored against their account and reviewed before
 * publishing. Mirrors the GitHub new-trail form's fields. Signed-out visitors
 * see a sign-in prompt instead of the form. Gates the form on `/api/auth/session`
 * so the POST never 401s for signed-out visitors.
 */
const fieldClass =
  "border-forest/20 text-ink w-full rounded-lg border bg-cream-50 px-3 py-2 text-sm";
const labelClass =
  "text-olive text-xs font-semibold tracking-wider uppercase";

export function TrailSubmissionForm() {
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

  if (state === "loading") return null;

  if (state === "anon") {
    return (
      <div className="border-forest/15 bg-cream-50 mt-4 rounded-2xl border p-6">
        <p className="text-ink/75 text-sm leading-relaxed">
          Sign in to suggest a trail right here, no git required. Your suggestion
          is reviewed before it goes on the map, and you are credited once it is
          approved.
        </p>
        <div className="mt-4 max-w-xs">
          <SignInOptions />
          <div className="mt-3">
            <PasskeyButton
              label="Sign in with a passkey"
              callbackUrl="/contribute"
            />
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setSubmitting(true);
    setStatus("Submitting…");
    try {
      // FormData (not JSON) so attached photos ride along; the route coerces
      // the numeric fields and validates server-side.
      const res = await fetch("/api/contributions/trail", {
        method: "POST",
        body: new FormData(form),
      });
      if (res.ok) {
        setStatus("Thank you. Your trail is in the queue for review.");
        form.reset();
      } else {
        setStatus("Could not submit. Check the required fields and try again.");
      }
    } catch {
      setStatus("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-4" noValidate>
      <div className="grid gap-1">
        <label htmlFor="sub-name" className={labelClass}>
          Trail name
        </label>
        <input id="sub-name" name="name" required className={fieldClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor="sub-region" className={labelClass}>
            Region
          </label>
          <select
            id="sub-region"
            name="region"
            required
            defaultValue=""
            className={fieldClass}
          >
            <option value="" disabled>
              Choose a Grand Division
            </option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r} Tennessee
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor="sub-area" className={labelClass}>
            Area or park
          </label>
          <input id="sub-area" name="area" required className={fieldClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor="sub-lat" className={labelClass}>
            Latitude
          </label>
          <input
            id="sub-lat"
            name="lat"
            type="number"
            step="any"
            required
            placeholder="35.7277"
            className={fieldClass}
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="sub-lng" className={labelClass}>
            Longitude
          </label>
          <input
            id="sub-lng"
            name="lng"
            type="number"
            step="any"
            required
            placeholder="-84.8556"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-1">
        <label htmlFor="sub-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="sub-description"
          name="description"
          required
          rows={4}
          placeholder="What makes this trail worth the drive? Surface, highlights, anything to know."
          className={fieldClass}
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="sub-photos" className={labelClass}>
          Photos (optional)
        </label>
        <input
          id="sub-photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="text-ink file:border-forest/20 file:bg-cream-50 file:text-pine hover:file:bg-parchment text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <p className="text-ink/60 text-xs">
          Up to 5 images, shared with reviewers. Only add photos that are yours
          to share.
        </p>
      </div>

      <details className="border-forest/10 rounded-lg border p-4">
        <summary className="text-forest cursor-pointer text-sm font-medium">
          Optional details
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <label htmlFor="sub-length" className={labelClass}>
              Length (miles)
            </label>
            <input
              id="sub-length"
              name="lengthMiles"
              type="number"
              step="any"
              min="0"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="sub-gain" className={labelClass}>
              Elevation gain (ft)
            </label>
            <input
              id="sub-gain"
              name="elevationGainFt"
              type="number"
              min="0"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="sub-difficulty" className={labelClass}>
              Difficulty
            </label>
            <select
              id="sub-difficulty"
              name="difficulty"
              defaultValue=""
              className={fieldClass}
            >
              <option value="">Not sure</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label htmlFor="sub-route" className={labelClass}>
              Route type
            </label>
            <select
              id="sub-route"
              name="routeType"
              defaultValue=""
              className={fieldClass}
            >
              <option value="">Not sure</option>
              {ROUTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <label htmlFor="sub-links" className={labelClass}>
              Helpful link
            </label>
            <input
              id="sub-links"
              name="links"
              type="url"
              placeholder="https://… an official trail or park page"
              className={fieldClass}
            />
          </div>
        </div>
      </details>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="accent" size="sm" disabled={submitting}>
          Submit for review
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>
    </form>
  );
}

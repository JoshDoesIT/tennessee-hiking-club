"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

const fieldClass =
  "border-forest/20 text-ink w-full rounded-lg border bg-cream-50 px-3 py-2 text-sm";
const labelClass = "text-olive text-xs font-semibold tracking-wider uppercase";

/**
 * "Contribute a recorded route" (#201): a signed-in member uploads the GPX from
 * a hike to improve the trail's drawn route. Mirrors the waypoint/photo
 * contribution forms: gated on sign-in, posts as multipart form-data, and lands
 * in the admin review queue. Renders nothing for signed-out visitors.
 */
export function ContributeRouteForm({
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
    const input = form.elements.namedItem("gpx") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file || file.size === 0) {
      setStatus("Choose a GPX file to upload.");
      return;
    }

    const data = new FormData();
    data.set("trailSlug", trailSlug);
    data.set("gpx", file);

    setSubmitting(true);
    setStatus("Uploading…");
    try {
      const res = await fetch("/api/contributions/route", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setStatus("Thanks. Your route is in the queue for review.");
        form.reset();
      } else {
        setStatus(
          "Could not read that track. Upload a GPX recorded on this trail.",
        );
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
      aria-label={`Contribute a recorded route for ${trailName}`}
      noValidate
    >
      <p className="text-forest text-sm font-medium">
        Hiked this with a GPS watch or app? Contribute your track
      </p>
      <p className="text-ink/70 text-sm">
        Upload the GPX from your hike to help us draw a more accurate route. A
        maintainer reviews every track before it goes live.
      </p>

      <div className="grid gap-1">
        <label htmlFor="route-gpx" className={labelClass}>
          GPX file
        </label>
        <input
          id="route-gpx"
          name="gpx"
          type="file"
          accept=".gpx,application/gpx+xml,application/xml,text/xml"
          required
          className={fieldClass}
        />
        <p className="text-ink/60 text-xs">
          Most watches and apps (AllTrails, Gaia, Strava) can export a GPX.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={submitting}>
          Contribute route
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>
    </form>
  );
}

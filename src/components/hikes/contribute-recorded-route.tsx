"use client";

import { useEffect, useState } from "react";
import { routeToGpx, type RoutePoint } from "@/lib/trails/elevation";
import { Button } from "@/components/ui/button";

/**
 * "Contribute this recorded track" (#201 follow-up). A hike recorded in the app
 * can improve a trail's drawn route the same way an uploaded GPX does, without
 * the round-trip of downloading the GPX and re-uploading it on the trail page.
 * It builds the same GPX the route-contribution form produces and posts it to
 * the identical endpoint, so a recorded track lands in the maintainer review
 * queue exactly like an uploaded one. Gated on sign-in; renders nothing for
 * signed-out members or a track too short to contribute.
 */
export function ContributeRecordedRoute({
  trailSlug,
  trailName,
  points,
}: {
  trailSlug: string;
  trailName: string;
  points: RoutePoint[];
}) {
  const [state, setState] = useState<"loading" | "anon" | "ready">("loading");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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

  if (state !== "ready" || points.length < 2) return null;

  async function contribute() {
    setSubmitting(true);
    setStatus("Sending…");
    try {
      const gpx = routeToGpx(trailName, points);
      const data = new FormData();
      data.set("trailSlug", trailSlug);
      data.set(
        "gpx",
        new File([gpx], `${trailSlug}.gpx`, { type: "application/gpx+xml" }),
      );
      const res = await fetch("/api/contributions/route", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setDone(true);
        setStatus("Thanks. Your track is in the queue for review.");
      } else {
        setStatus("Could not send that track. Please try again.");
      }
    } catch {
      setStatus("Could not send that track. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p role="status" aria-live="polite" className="text-pine mt-2 text-sm">
        {status}
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={submitting}
        onClick={() => void contribute()}
      >
        {submitting ? "Sending…" : "Contribute to this trail’s route"}
      </Button>
      <span role="status" aria-live="polite" className="text-pine text-sm">
        {status}
      </span>
    </div>
  );
}

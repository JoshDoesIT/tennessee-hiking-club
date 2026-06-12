"use client";

import { useCallback, useEffect, useState } from "react";
import { TrailCard } from "./trail-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { trailsByDistance } from "@/lib/trails/distance";
import {
  isLocationEnabled,
  setLocationEnabled,
} from "@/lib/maps/location-pref";
import type { Trail } from "@/lib/trails/schema";

type Sorted = (Trail & { distanceMi?: number })[];

/**
 * The trail results grid with an optional, privacy-preserving "sort by distance
 * from me" control. Geolocation is requested only on the user's tap, the
 * coordinates are used in memory to compute distances on the device, and they
 * are never stored or sent anywhere.
 */
export function TrailResults({ trails }: { trails: Trail[] }) {
  const [sorted, setSorted] = useState<Sorted | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const applyPosition = useCallback(
    (pos: GeolocationPosition) => {
      // Remember the opt-in so other maps and this list can apply it
      // automatically next time, without re-prompting (#285).
      setLocationEnabled(true);
      setSorted(
        trailsByDistance(trails, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      );
      setStatus(
        "Sorted by distance from you. Your location stayed on this device.",
      );
      setBusy(false);
    },
    [trails],
  );

  const onLocateError = useCallback(() => {
    setStatus("Couldn’t get your location, so the default order is shown.");
    setBusy(false);
  }, []);

  function sortByDistance() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("Location isn’t available on this device.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(applyPosition, onLocateError, {
      maximumAge: 60_000,
      timeout: 10_000,
    });
  }

  // If the member already shared their location elsewhere, sort by distance
  // automatically on load so they don't have to tap and re-share each visit.
  // The request is async, so state only changes in the callbacks above.
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.geolocation &&
      isLocationEnabled()
    ) {
      navigator.geolocation.getCurrentPosition(applyPosition, onLocateError, {
        maximumAge: 60_000,
        timeout: 10_000,
      });
    }
  }, [applyPosition, onLocateError]);

  const list: Sorted = sorted ?? trails;

  return (
    <div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {sorted ? (
          <button
            type="button"
            onClick={() => {
              setSorted(null);
              setStatus("");
            }}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Default order
          </button>
        ) : (
          <button
            type="button"
            onClick={sortByDistance}
            disabled={busy}
            aria-busy={busy}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {busy ? "Locating…" : "Sort by distance from me"}
          </button>
        )}
        <p className="text-ink/70 text-xs">
          Uses your device location to sort. It stays on this device and is
          never sent anywhere.
        </p>
      </div>

      <p role="status" aria-live="polite" className="text-pine min-h-5 text-sm">
        {status}
      </p>

      <ul className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((trail) => (
          <li key={trail.slug}>
            <TrailCard trail={trail} distanceMi={trail.distanceMi} />
          </li>
        ))}
      </ul>
    </div>
  );
}

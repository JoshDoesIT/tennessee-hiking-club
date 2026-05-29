"use client";

import { routeToGpx, type RoutePoint } from "@/lib/trails/elevation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Download the trail's route as a GPX file for any external GPS app. */
export function DownloadGpx({
  trail,
}: {
  trail: { name: string; route: RoutePoint[] };
}) {
  function download() {
    const gpx = routeToGpx(trail.name, trail.route);
    const url = URL.createObjectURL(
      new Blob([gpx], { type: "application/gpx+xml" }),
    );
    const slug =
      trail.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "trail";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.gpx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      Download GPX
    </button>
  );
}

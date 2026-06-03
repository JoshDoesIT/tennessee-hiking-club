"use client";

import { routeToGpx, type RoutePoint } from "@/lib/trails/elevation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { saveOrShareTextFile } from "@/lib/share/save-file";

/** Download the trail's route as a GPX file for any external GPS app. On the
 *  native app this opens the share sheet instead of a browser download (#245). */
export function DownloadGpx({
  trail,
}: {
  trail: { name: string; route: RoutePoint[] };
}) {
  async function download() {
    const gpx = routeToGpx(trail.name, trail.route);
    const slug =
      trail.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "trail";
    await saveOrShareTextFile(`${slug}.gpx`, gpx, "application/gpx+xml");
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      Download GPX
    </button>
  );
}

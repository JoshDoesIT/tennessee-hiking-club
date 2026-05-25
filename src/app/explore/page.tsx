import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Explore the map",
  description:
    "An interactive, stylized map of Tennessee with a pin for every trail.",
};

export default function ExplorePage() {
  return (
    <ComingSoon
      eyebrow="Interactive map"
      title="Explore Tennessee"
      milestone="M3 · Interactive Tennessee Map"
    >
      A stylized, clickable map of Tennessee with a pin for every trail is on
      its way. Pick a region, tap a peak, and open the details in a single
      click.
    </ComingSoon>
  );
}

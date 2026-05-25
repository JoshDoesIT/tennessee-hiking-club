import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Contribute a trail",
  description:
    "Help build Tennessee's most complete community trail map — contribute a trail.",
};

export default function ContributePage() {
  return (
    <ComingSoon
      eyebrow="Open source"
      title="Add a trail to the map"
      milestone="M2 · Trail Data Model & Content"
    >
      Trails live as simple, reviewed files in our open-source repository — so
      anyone can add one. A guided submission form and contributor guide are
      coming; for now, open an issue on GitHub to suggest a trail.
    </ComingSoon>
  );
}

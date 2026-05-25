import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Trails",
  description:
    "Browse Tennessee hiking trails by region, difficulty, and length.",
};

export default function TrailsPage() {
  return (
    <ComingSoon
      eyebrow="Trail directory"
      title="Every trail, in one place"
      milestone="M4 · Trail Directory & Detail Pages"
    >
      A searchable directory of Tennessee trails — filter by region, difficulty,
      and length, then open a trail for photos, stats, and one-tap directions.
    </ComingSoon>
  );
}

import { ImageResponse } from "next/og";
import { getAllTrails, getTrailBySlug } from "@/lib/trails";

export const alt = "Tennessee Hiking Club trail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllTrails().map((trail) => ({ slug: trail.slug }));
}

/** Branded, generated Open Graph card for each trail (name + key stats). */
export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trail = getTrailBySlug(slug);
  const name = trail?.name ?? "Tennessee Hiking Club";
  const difficulty = trail
    ? trail.difficulty.charAt(0).toUpperCase() + trail.difficulty.slice(1)
    : "";
  const subtitle = trail
    ? `${trail.region} Tennessee  ·  ${trail.lengthMiles} mi  ·  ${difficulty}`
    : "Explore Tennessee's trails";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#2a3623",
        color: "#fbf6e9",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 30,
          letterSpacing: 6,
          fontWeight: 600,
          color: "#e0a24c",
        }}
      >
        TENNESSEE HIKING CLUB
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            marginTop: 28,
            color: "#c6c680",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>,
    { ...size },
  );
}

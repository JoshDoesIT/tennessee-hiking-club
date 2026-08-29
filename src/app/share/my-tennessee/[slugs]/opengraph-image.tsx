import { ImageResponse } from "next/og";
import { getAllTrails } from "@/lib/trails";
import { tennesseeMapData } from "@/components/map/map-data";
import { MAP_WIDTH, MAP_HEIGHT } from "@/lib/geo/projection";
import { parseShareSlugs } from "@/lib/share/my-tennessee";

export const alt = "My Tennessee: a shared map of hiked trails";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamic Open Graph card for a shared "my Tennessee" map. Draws the same
 *  stylized state outline and lights up the provided trail slugs. */
export default async function OgImage({
  params,
}: {
  params: Promise<{ slugs: string }>;
}) {
  const { slugs } = await params;
  const trails = getAllTrails();
  const hiked = parseShareSlugs(slugs, trails);
  const mapData = tennesseeMapData(trails);
  const hikedSet = new Set(hiked);
  const regions = new Set(
    trails.filter((t) => hikedSet.has(t.slug)).map((t) => t.region),
  );

  // Render the map at a fixed pixel size inside the 1200x630 card. The
  // viewBox is the same as the live SVG so projected pin coordinates map
  // straight through.
  const mapPxWidth = 1000;
  const mapPxHeight = (mapPxWidth / MAP_WIDTH) * MAP_HEIGHT;

  const subtitle = `${hiked.length} ${
    hiked.length === 1 ? "trail" : "trails"
  } hiked across ${regions.size} of 3 Grand Divisions`;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        // Generous padding keeps every line inside the safe-zone that
        // platforms like Teams crop into when previewing a 1200x630 card.
        padding: "80px 96px",
        background: "#fbf6e9",
        color: "#2a3623",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 22,
          letterSpacing: 4,
          fontWeight: 600,
          color: "#e0a24c",
        }}
      >
        TENNESSEE HIKING CLUB
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 800,
          marginTop: 4,
        }}
      >
        My Tennessee
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 26,
          color: "#475036",
          marginTop: 6,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 24,
          justifyContent: "center",
        }}
      >
        <svg
          width={mapPxWidth}
          height={mapPxHeight}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={mapData.outline}
            fill="#c6c680"
            fillOpacity={0.4}
            stroke="#2a3623"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {mapData.pins.map((pin) => {
            const isHiked = hikedSet.has(pin.slug);
            const cx = (pin.xPct / 100) * MAP_WIDTH;
            const cy = (pin.yPct / 100) * MAP_HEIGHT;
            return (
              <circle
                key={pin.slug}
                cx={cx}
                cy={cy}
                r={isHiked ? 7 : 3.5}
                fill={isHiked ? "#e0a24c" : "#2a3623"}
                fillOpacity={isHiked ? 1 : 0.18}
                stroke="#2a3623"
                strokeWidth={isHiked ? 1.8 : 0.5}
              />
            );
          })}
        </svg>
      </div>
    </div>,
    { ...size },
  );
}

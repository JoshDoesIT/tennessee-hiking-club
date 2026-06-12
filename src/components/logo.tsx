/**
 * Peak + Pin brand mark and lockup (spec 0010, brand Concept 5).
 *
 * The mark is a map pin whose ring head holds a mountain scene: faceted peaks
 * rising behind a rolling foothill that merges into the pin's solid tail —
 * "a trail, located." It renders as inline SVG so it costs no image request,
 * inherits `currentColor`, and can be animated (`pin-drop` / `pin-ping` in
 * `globals.css`). Raster brand assets are generated from this same geometry
 * by `scripts/build-brand-assets.mjs`.
 */
import { useId } from "react";

/* Shared geometry, 96×96 box. The pin tip lands on (48, 92). The teardrop
 * minus the inner circle (even-odd) leaves a thin ring head and a solid tail;
 * the scene is clipped to the inner circle so the foothill fuses with the
 * tail. */
export const PIN_OUTER = "M25.3 59.6A30 30 0 1 1 70.7 59.6L48 86Z";
export const PIN_INNER = "M48 16a24 24 0 1 0 0 48 24 24 0 0 0 0-48Z";
/** Slightly wider than the ring window so the clipped scene tucks under the
 *  ring with no anti-aliased seam. */
export const PIN_CLIP = "M48 13.5a26.5 26.5 0 1 0 0 53 26.5 26.5 0 0 0 0-53Z";
/** Even-odd: the subpaths after the silhouette are snow facets on the main
 *  face, knocked out like the sheet's mark. */
export const SCENE_PEAKS =
  "M26 53 38.5 36.5l5 6L51 23.5l8 13.5 3.5-5L72 49v4Z M51 26.5 47.2 38.2l2.6-2.1 1.4 3.1 1.8-7.6Z M38.5 39.2l-2.4 5 2.1-1.2Z";
export const SCENE_HILL =
  "M16 55C26 49.5 36 50 46 53.5c8 1.9 16 1.6 24 .3 4-.7 7-1.7 10-3v26H16Z";

type MarkProps = {
  /** Pixel height of the mark. */
  size?: number;
  /** Hide from assistive tech (when adjacent text names the club). */
  decorative?: boolean;
  className?: string;
};

export function PeakPinMark({
  size = 44,
  decorative = false,
  className = "",
}: MarkProps) {
  const clipId = useId();
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": "Tennessee Hiking Club" } as const);
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      {...a11y}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={PIN_CLIP} />
        </clipPath>
      </defs>
      <path fillRule="evenodd" d={`${PIN_OUTER} ${PIN_INNER}`} />
      <g clipPath={`url(#${clipId})`}>
        <path fillRule="evenodd" d={SCENE_PEAKS} />
        <path d={SCENE_HILL} />
      </g>
    </svg>
  );
}

type LogoProps = {
  /** Pixel size of the pin mark. */
  size?: number;
  /** Show the "TN Hiking Club" wordmark beside the mark. */
  withWordmark?: boolean;
  /** Show the tagline under the wordmark (needs `withWordmark`). */
  withTagline?: boolean;
  /** Color scheme for placement on light or dark surfaces. */
  tone?: "dark" | "light";
  className?: string;
  /** Kept for call-site compatibility; the inline SVG needs no preloading. */
  priority?: boolean;
};

export function Logo({
  size = 44,
  withWordmark = true,
  withTagline = true,
  tone = "dark",
  className = "",
}: LogoProps) {
  const mark = tone === "light" ? "text-cream" : "text-forest";
  const word = tone === "light" ? "text-cream" : "text-forest";
  const sub = tone === "light" ? "text-mist" : "text-olive";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <PeakPinMark size={size} className={mark} />
      {withWordmark && (
        <span className="flex flex-col justify-center gap-1 leading-none">
          <span
            className={`text-[1.05rem] font-extrabold tracking-[0.02em] uppercase ${word}`}
          >
            TN Hiking Club
          </span>
          {withTagline && (
            <span
              className={`flex items-center gap-1.5 text-[0.52rem] font-semibold tracking-[0.3em] uppercase ${sub}`}
            >
              <span
                aria-hidden="true"
                className="bg-tn-orange h-px w-3.5 shrink-0"
              />
              Explore Tennessee Together
              <span
                aria-hidden="true"
                className="bg-tn-orange h-px w-3.5 shrink-0"
              />
            </span>
          )}
        </span>
      )}
    </span>
  );
}

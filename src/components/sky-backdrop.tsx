/**
 * Full-hero sky behind the landing content (#167): a warm sun in the upper right
 * by day that becomes a moon in the upper left at night, with a field of stars
 * filling the whole sky after dark. Living across the entire hero (not the thin
 * ridgeline band) lets the stars fill the sky and keeps the sun and moon clear
 * of the headline and buttons. Purely decorative; hidden from assistive tech.
 */

// Percent-positioned so the field fills the responsive hero without any SVG
// viewBox cropping. Spread across the sky; the lowest ones are tucked behind the
// ridgeline. `s` is the diameter in px.
const STARS = [
  { top: 6, left: 8, s: 2, d: "0s", dur: "4s" },
  { top: 4, left: 22, s: 3, d: "1.4s", dur: "5.2s" },
  { top: 9, left: 35, s: 2, d: "2.6s", dur: "3.6s" },
  { top: 3, left: 48, s: 2, d: "0.7s", dur: "4.6s" },
  { top: 8, left: 62, s: 3, d: "3.3s", dur: "5s" },
  { top: 5, left: 74, s: 2, d: "2s", dur: "3.9s" },
  { top: 10, left: 88, s: 2, d: "1.1s", dur: "4.4s" },
  { top: 13, left: 16, s: 2, d: "2.9s", dur: "5.4s" },
  { top: 16, left: 44, s: 3, d: "0.4s", dur: "3.7s" },
  { top: 14, left: 58, s: 2, d: "1.8s", dur: "4.8s" },
  { top: 18, left: 80, s: 2, d: "3.6s", dur: "4.1s" },
  { top: 20, left: 28, s: 3, d: "0.9s", dur: "5.1s" },
  { top: 22, left: 68, s: 2, d: "2.3s", dur: "3.8s" },
  { top: 24, left: 94, s: 2, d: "1.5s", dur: "4.5s" },
  { top: 25, left: 6, s: 2, d: "3s", dur: "4.2s" },
  { top: 28, left: 38, s: 3, d: "0.2s", dur: "5.3s" },
  { top: 30, left: 52, s: 2, d: "2.7s", dur: "3.6s" },
  { top: 27, left: 84, s: 2, d: "1.2s", dur: "4.9s" },
  { top: 33, left: 18, s: 2, d: "3.9s", dur: "4.3s" },
  { top: 35, left: 72, s: 3, d: "0.6s", dur: "5s" },
  { top: 37, left: 90, s: 2, d: "2.1s", dur: "3.9s" },
  { top: 38, left: 32, s: 2, d: "1.7s", dur: "4.6s" },
  { top: 41, left: 60, s: 2, d: "3.2s", dur: "5.2s" },
  { top: 43, left: 10, s: 3, d: "0.8s", dur: "4s" },
  { top: 45, left: 78, s: 2, d: "2.5s", dur: "3.7s" },
  { top: 47, left: 46, s: 2, d: "1.3s", dur: "4.8s" },
  { top: 50, left: 24, s: 2, d: "3.5s", dur: "5.1s" },
  { top: 52, left: 66, s: 2, d: "0.5s", dur: "4.4s" },
  { top: 54, left: 92, s: 2, d: "2.8s", dur: "3.8s" },
  { top: 56, left: 14, s: 2, d: "1.6s", dur: "4.7s" },
  { top: 58, left: 84, s: 2, d: "3.1s", dur: "5s" },
];

export function SkyBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* stars (night only) */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="animate-twinkle absolute rounded-full bg-[#eef0e2]"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: star.s,
              height: star.s,
              animationDelay: star.d,
              animationDuration: star.dur,
            }}
          />
        ))}
      </div>

      {/* setting sun (day), upper right. The opacity crossfade is on this wrapper,
          not the animated <svg>, so the glow pulse can't override the fade-out. */}
      <div
        data-celestial="sun"
        className="absolute top-[6%] right-[6%] transition-opacity duration-700 sm:top-[9%] sm:right-[11%] dark:opacity-0"
      >
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="animate-sun h-28 w-28 sm:h-40 sm:w-40"
          style={{ transformOrigin: "center" }}
        >
          <defs>
            <radialGradient id="sky-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f4c074" />
              <stop offset="45%" stopColor="#e0a24c" />
              <stop offset="100%" stopColor="#e0a24c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="80" fill="url(#sky-sun)" />
          <circle cx="80" cy="80" r="40" fill="#eab35e" />
        </svg>
      </div>

      {/* rising crescent moon (night), upper left */}
      <div
        data-celestial="moon"
        className="absolute top-[5%] left-[6%] opacity-0 transition-opacity duration-700 sm:top-[8%] sm:left-[10%] dark:opacity-100"
      >
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          className="h-24 w-24 sm:h-32 sm:w-32"
        >
          <defs>
            <mask id="sky-moon-mask">
              <circle cx="68" cy="65" r="44" fill="white" />
              <circle cx="48" cy="58" r="41" fill="black" />
            </mask>
          </defs>
          {/* a clean crescent (lit disc with an offset bite), craters on the lit
              limb, and a warm amber rim, with no halo blob behind it */}
          <g mask="url(#sky-moon-mask)">
            <circle cx="68" cy="65" r="44" fill="#ece8d4" />
            <circle cx="90" cy="52" r="3.5" fill="#d6cfb2" opacity="0.6" />
            <circle cx="96" cy="72" r="2.6" fill="#d6cfb2" opacity="0.5" />
            <circle cx="82" cy="78" r="2" fill="#d6cfb2" opacity="0.45" />
          </g>
          <path
            d="M68 22 A43 43 0 0 1 68 108"
            fill="none"
            stroke="#e9b870"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
}

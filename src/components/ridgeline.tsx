/**
 * Decorative layered ridgeline with a setting sun by day and a rising moon by
 * night (#167). The sun and moon cross-fade and the ridges deepen to dusk when
 * dark mode is on. Purely ornamental; hidden from assistive tech.
 */
const STARS = [
  { cx: 250, cy: 90, r: 2.1, d: "0s" },
  { cx: 430, cy: 150, r: 1.5, d: "1.4s" },
  { cx: 700, cy: 70, r: 2.4, d: "2.6s" },
  { cx: 1280, cy: 110, r: 1.7, d: "0.7s" },
  { cx: 1360, cy: 210, r: 2, d: "3.3s" },
  { cx: 880, cy: 130, r: 1.4, d: "2s" },
  { cx: 540, cy: 60, r: 1.6, d: "4s" },
];

export function Ridgeline({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 440"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="thc-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f4c074" />
          <stop offset="55%" stopColor="#e0a24c" />
          <stop offset="100%" stopColor="#e0a24c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="thc-moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f3efde" />
          <stop offset="55%" stopColor="#cdd0c0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#cdd0c0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* stars (night only) */}
      <g className="opacity-0 transition-opacity duration-700 dark:opacity-100">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#eef0e2"
            className="animate-twinkle"
            style={{ animationDelay: s.d }}
          />
        ))}
      </g>

      {/* setting sun (day) */}
      <g
        className="animate-sun transition-opacity duration-700 dark:opacity-0"
        style={{ transformOrigin: "1040px 250px" }}
      >
        <circle cx="1040" cy="250" r="190" fill="url(#thc-sun)" />
        <circle cx="1040" cy="250" r="94" fill="#eab35e" />
      </g>

      {/* rising moon (night) */}
      <g className="opacity-0 transition-opacity duration-700 dark:opacity-100">
        <circle cx="1040" cy="250" r="180" fill="url(#thc-moon-glow)" />
        <circle cx="1040" cy="250" r="88" fill="#ece8d4" />
        <circle cx="1066" cy="232" r="13" fill="#dad4ba" opacity="0.7" />
        <circle cx="1018" cy="272" r="9" fill="#dad4ba" opacity="0.7" />
        <circle cx="1052" cy="278" r="6" fill="#dad4ba" opacity="0.6" />
        <circle
          cx="1040"
          cy="250"
          r="88"
          fill="none"
          stroke="#e0a24c"
          strokeWidth="1.5"
          opacity="0.25"
        />
      </g>

      {/* far ridge */}
      <path
        className="transition-colors duration-700 fill-[#c6c680] dark:fill-[#3a4636]"
        d="M0 300 L150 250 L300 288 L470 214 L640 280 L820 200 L1010 268 L1200 206 L1360 264 L1440 232 L1440 440 L0 440 Z"
      />
      {/* mid ridge */}
      <path
        className="transition-colors duration-700 fill-[#959760] dark:fill-[#2c382a]"
        d="M0 338 L180 300 L360 336 L540 282 L720 338 L920 288 L1120 340 L1320 292 L1440 330 L1440 440 L0 440 Z"
      />
      {/* near ridge */}
      <path
        className="transition-colors duration-700 fill-[#6c724a] dark:fill-[#212c20]"
        d="M0 372 L210 344 L420 378 L640 334 L860 380 L1080 342 L1300 382 L1440 356 L1440 440 L0 440 Z"
      />
      {/* foreground treeline */}
      <path
        className="transition-colors duration-700 fill-[#2a3623] dark:fill-[#131b13]"
        d="M0 404 L120 392 L240 408 L380 390 L520 408 L680 392 L840 408 L1000 392 L1180 408 L1340 394 L1440 406 L1440 440 L0 440 Z"
      />
    </svg>
  );
}

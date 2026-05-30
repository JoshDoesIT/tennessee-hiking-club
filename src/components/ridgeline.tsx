/**
 * Decorative layered ridgeline with a setting sun by day and a rising moon by
 * night (#167). The sun and moon cross-fade and the ridges deepen to dusk when
 * dark mode is on. Purely ornamental; hidden from assistive tech.
 */
// On wide screens `slice` crops the TOP of the viewBox, so high stars only show
// on phones (which show the full height but a narrower centre column). Hence two
// groups: an upper field concentrated in the centre (visible high up on phones)
// and a lower field across the width (survives the desktop crop). Both keep
// clear of the moon, which sits at x~1040 on desktop and x~660 on phones.
const STARS = [
  // upper sky (shows high up on phones; crops on very wide screens)
  { cx: 250, cy: 120, r: 1.5, d: "2.9s", dur: "4.4s" },
  { cx: 500, cy: 150, r: 1.3, d: "1.8s", dur: "4s" },
  { cx: 560, cy: 92, r: 1.8, d: "0.6s", dur: "4.3s" },
  { cx: 620, cy: 140, r: 1.4, d: "2.1s", dur: "3.7s" },
  { cx: 680, cy: 78, r: 2.1, d: "1.5s", dur: "5s" },
  { cx: 730, cy: 150, r: 1.5, d: "3.4s", dur: "4.1s" },
  { cx: 770, cy: 100, r: 2.3, d: "0.3s", dur: "4.9s" },
  { cx: 850, cy: 134, r: 1.5, d: "2.6s", dur: "3.6s" },
  { cx: 910, cy: 88, r: 1.8, d: "1s", dur: "5.3s" },
  { cx: 1180, cy: 110, r: 1.6, d: "0.7s", dur: "4.7s" },
  { cx: 1320, cy: 96, r: 1.5, d: "2.3s", dur: "4.2s" },
  // lower sky (shows across the width on desktop)
  { cx: 120, cy: 210, r: 1.6, d: "0.2s", dur: "4s" },
  { cx: 210, cy: 262, r: 2.2, d: "1.1s", dur: "5.2s" },
  { cx: 320, cy: 188, r: 1.4, d: "2.4s", dur: "3.6s" },
  { cx: 430, cy: 244, r: 1.8, d: "0.8s", dur: "4.6s" },
  { cx: 520, cy: 200, r: 2.0, d: "3.1s", dur: "5s" },
  { cx: 820, cy: 210, r: 1.7, d: "3.6s", dur: "3.7s" },
  { cx: 900, cy: 262, r: 1.5, d: "1.3s", dur: "4.8s" },
  { cx: 1180, cy: 200, r: 2.0, d: "0.9s", dur: "4.2s" },
  { cx: 1280, cy: 258, r: 1.5, d: "2.8s", dur: "5.1s" },
  { cx: 1360, cy: 200, r: 2.3, d: "1.9s", dur: "3.8s" },
  { cx: 1410, cy: 262, r: 1.6, d: "0.4s", dur: "4.5s" },
];

/** The crescent moon body (glow, masked crescent + craters, warm limb glint),
 *  drawn at x~1040. Rendered twice by `Ridgeline` at different positions for
 *  phone vs. desktop, so the narrow mobile crop never hides it. */
function MoonShape() {
  return (
    <>
      <circle cx="1090" cy="250" r="108" fill="url(#thc-moon-glow)" />
      <g mask="url(#thc-moon-mask)">
        <circle cx="1040" cy="250" r="88" fill="#ece8d4" />
        <circle cx="1102" cy="236" r="5.5" fill="#d6cfb2" opacity="0.65" />
        <circle cx="1112" cy="264" r="4" fill="#d6cfb2" opacity="0.55" />
        <circle cx="1090" cy="252" r="3" fill="#d6cfb2" opacity="0.5" />
      </g>
      <path
        d="M1091 178 A88 88 0 0 1 1091 322"
        fill="none"
        stroke="#e9b870"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </>
  );
}

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
          <stop offset="0%" stopColor="#f3efde" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#dfe0cf" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#cdd0c0" stopOpacity="0" />
        </radialGradient>
        {/* Crescent: a lit disc with an offset disc bitten out of it. */}
        <mask id="thc-moon-mask">
          <circle cx="1040" cy="250" r="88" fill="white" />
          <circle cx="1000" cy="244" r="82" fill="black" />
        </mask>
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
            style={{ animationDelay: s.d, animationDuration: s.dur }}
          />
        ))}
      </g>

      {/* setting sun (day). The opacity crossfade lives on this outer group,
          NOT the animated one: a running `animate-sun` sets `opacity` from its
          keyframes, which would override `dark:opacity-0` and leave the sun
          showing at night. Wrapping keeps the fade-out a separate concern. */}
      <g
        data-celestial="sun"
        className="transition-opacity duration-700 dark:opacity-0"
      >
        <g className="animate-sun" style={{ transformOrigin: "1040px 250px" }}>
          <circle cx="1040" cy="250" r="190" fill="url(#thc-sun)" />
          <circle cx="1040" cy="250" r="94" fill="#eab35e" />
        </g>
      </g>

      {/* rising crescent moon (night). Two positions share the fade/crossfade
          wrapper: centred for phones (so the narrow `slice` crop does not hide
          it off to the right) and on the right at >=sm. The shifted group also
          carries the same mask, since userSpaceOnUse masks follow the transform. */}
      <g
        data-celestial="moon"
        className="opacity-0 transition-opacity duration-700 dark:opacity-100"
      >
        <g className="hidden sm:block">
          <MoonShape />
        </g>
        <g className="sm:hidden" transform="translate(-380 -40)">
          <MoonShape />
        </g>
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

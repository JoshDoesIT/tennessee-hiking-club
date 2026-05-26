/**
 * Decorative layered ridgeline + setting sun that echoes the badge logo.
 * Purely ornamental; hidden from assistive tech.
 */
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
      </defs>

      {/* setting sun */}
      <g className="animate-sun" style={{ transformOrigin: "1040px 250px" }}>
        <circle cx="1040" cy="250" r="190" fill="url(#thc-sun)" />
        <circle cx="1040" cy="250" r="94" fill="#eab35e" />
      </g>

      {/* far ridge */}
      <path
        fill="#c6c680"
        d="M0 300 L150 250 L300 288 L470 214 L640 280 L820 200 L1010 268 L1200 206 L1360 264 L1440 232 L1440 440 L0 440 Z"
      />
      {/* mid ridge */}
      <path
        fill="#959760"
        d="M0 338 L180 300 L360 336 L540 282 L720 338 L920 288 L1120 340 L1320 292 L1440 330 L1440 440 L0 440 Z"
      />
      {/* near ridge */}
      <path
        fill="#6c724a"
        d="M0 372 L210 344 L420 378 L640 334 L860 380 L1080 342 L1300 382 L1440 356 L1440 440 L0 440 Z"
      />
      {/* foreground treeline */}
      <path
        fill="#2a3623"
        d="M0 404 L120 392 L240 408 L380 390 L520 408 L680 392 L840 408 L1000 392 L1180 408 L1340 394 L1440 406 L1440 440 L0 440 Z"
      />
    </svg>
  );
}

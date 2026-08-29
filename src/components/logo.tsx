import Image from "next/image";

type LogoProps = {
  /** Pixel size of the circular badge. */
  size?: number;
  /** Show the "Tennessee / Hiking Club" wordmark next to the badge. */
  withWordmark?: boolean;
  /** Color scheme for the wordmark text. */
  tone?: "dark" | "light";
  className?: string;
  /** Eagerly load (use for above-the-fold placements). */
  priority?: boolean;
};

export function Logo({
  size = 44,
  withWordmark = true,
  tone = "dark",
  className = "",
  priority = false,
}: LogoProps) {
  const word = tone === "light" ? "text-cream" : "text-forest";
  // Moss mirrors the kit lockup's "HIKING CLUB" line: raw moss on dark panels
  // (8.2:1 on Evergreen), AA-safe moss-700 on light grounds (5.3:1 on cream).
  const sub = tone === "light" ? "text-moss" : "text-moss-700";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="Tennessee Hiking Club circular logo showing a hiker on a mountain summit above layered mountain ridges and pine trees."
        width={size}
        height={size}
        priority={priority}
        className="drop-shadow-sm"
      />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className={`display text-lg font-semibold ${word}`}>
            Tennessee
          </span>
          <span
            className={`text-[0.62rem] font-semibold tracking-[0.28em] uppercase ${sub}`}
          >
            Hiking Club
          </span>
        </span>
      )}
    </span>
  );
}

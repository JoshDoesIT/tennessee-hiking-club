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
  const sub = tone === "light" ? "text-sage-100" : "text-olive";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="Tennessee Hiking Club badge"
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

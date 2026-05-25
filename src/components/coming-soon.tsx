import Link from "next/link";
import type { ReactNode } from "react";

const REPO = "https://github.com/JoshDoesIT/tennessee-hiking-club";

/**
 * Provisional page shell used while a feature is still on the roadmap.
 * Replaced by the real implementation as each milestone ships.
 */
export function ComingSoon({
  eyebrow,
  title,
  milestone,
  children,
}: {
  eyebrow: string;
  title: string;
  milestone: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
      <p className="eyebrow text-amber-600">{eyebrow}</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">{title}</h1>
      <div className="text-ink/70 mx-auto mt-5 max-w-xl text-lg leading-relaxed">
        {children}
      </div>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="bg-forest text-cream hover:bg-pine rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Back to home
        </Link>
        <Link
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="border-forest/20 text-forest hover:bg-forest/5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Follow progress on GitHub
        </Link>
      </div>
      <p className="text-olive mt-8 text-sm">
        On the roadmap — <span className="font-semibold">{milestone}</span>
      </p>
    </section>
  );
}

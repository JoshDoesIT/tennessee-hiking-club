"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  /** Stagger offset in ms, exposed to CSS as `--reveal-delay`. */
  delay?: number;
};

/**
 * One-shot scroll entrance (spec 0010). Children render normally on the
 * server and for users with reduced motion (the global rule zeroes the
 * transition); in the browser the block starts in its "hidden" pose and
 * settles in the first time it enters the viewport. Style lives in
 * `globals.css` under `[data-revealed]`.
 */
export function Reveal({ delay = 0, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      style={
        { ...style, "--reveal-delay": `${delay}ms` } as React.CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  );
}

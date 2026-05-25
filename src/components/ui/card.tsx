import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Add a subtle hover lift (for clickable cards). */
  interactive?: boolean;
};

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border-forest/10 bg-cream-50 rounded-2xl border p-6",
        interactive && "transition-all hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

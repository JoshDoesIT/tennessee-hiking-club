import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Centered max-width content wrapper. Override width with `max-w-*`. */
export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto max-w-6xl px-5", className)} {...props} />;
}

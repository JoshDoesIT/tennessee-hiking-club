import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold tracking-wider uppercase",
  {
    variants: {
      variant: {
        soft: "bg-amber/20 text-amber-700",
        forest: "bg-forest text-cream",
        outline: "border border-forest/20 text-forest",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.6rem]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "soft", size: "sm" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex touch-manipulation items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-forest text-cream shadow-sm hover:bg-pine",
        // Amber stays a warm light surface in both themes, so its label keeps
        // the brand dark green even at night (text-forest flips light otherwise).
        accent: "bg-amber text-forest hover:bg-amber-600 dark:text-[#2a3623]",
        outline: "border border-forest/25 text-forest hover:bg-forest/5",
        ghost: "text-forest hover:bg-forest/5",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

/**
 * Brand button. For links styled as buttons, apply `buttonVariants(...)` to a
 * `<Link>` (the shadcn pattern) rather than nesting an `<a>` in a `<button>`.
 */
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

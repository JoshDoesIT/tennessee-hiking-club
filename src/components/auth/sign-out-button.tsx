"use client";

import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/auth/signout", { method: "POST" });
          window.location.reload();
        })
      }
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

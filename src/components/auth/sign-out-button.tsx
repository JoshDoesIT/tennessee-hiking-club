"use client";

import { signOut } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
    >
      Sign out
    </button>
  );
}

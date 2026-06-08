"use client";

import { appSignOut } from "@/lib/auth/native-signout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void appSignOut()}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
    >
      Sign out
    </button>
  );
}

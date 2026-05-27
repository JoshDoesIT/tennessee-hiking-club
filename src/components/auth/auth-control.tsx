"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { SignOutButton } from "./sign-out-button";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * Header auth control. Reads the Auth.js session from `/api/auth/session` on
 * mount (so pages stay statically rendered) and shows either a "Sign in" link
 * to the provider page or the signed-in user with a sign-out button. Renders
 * nothing until loaded to avoid a hydration mismatch and auth-state flicker.
 */
export function AuthControl({ className }: { className?: string }) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (active) setUser((session?.user as SessionUser | undefined) ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (user === undefined) return null;

  if (!user) {
    return (
      <Link
        href="/signin"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), className)}
      >
        Sign in
      </Link>
    );
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="text-forest/80 max-w-[12ch] truncate text-sm font-medium">
        {user.name || user.email || "Signed in"}
      </span>
      <SignOutButton />
    </span>
  );
}

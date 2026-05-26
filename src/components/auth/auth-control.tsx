"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { SignOutButton } from "./sign-out-button";

type User = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

/**
 * Header auth control. Fetches the session from `/api/auth/me` on mount (so the
 * pages stay statically rendered) and shows either a "Sign in with Vercel" link
 * or the signed-in user with a sign-out button. Renders nothing until loaded to
 * avoid a hydration mismatch and auth-state flicker.
 */
export function AuthControl({ className }: { className?: string }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (active) setUser((data.user as User | null) ?? null);
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
      <a
        href="/api/auth/authorize"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), className)}
      >
        Sign in
      </a>
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

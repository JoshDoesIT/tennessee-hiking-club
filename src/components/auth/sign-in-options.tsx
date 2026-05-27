"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

type ProviderInfo = { id: string; name: string };

/**
 * Lists the configured Auth.js providers (from `/api/auth/providers`) as
 * "Continue with X" buttons, so only providers whose credentials are set show
 * up. Each starts the OAuth flow and returns to the hikes page.
 */
export function SignInOptions() {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => {
        if (active) setProviders(Object.values(data ?? {}) as ProviderInfo[]);
      })
      .catch(() => {
        if (active) setProviders([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (providers === null) {
    return <p className="text-ink/70 text-sm">Loading sign-in options…</p>;
  }

  if (providers.length === 0) {
    return (
      <p className="text-ink/70 text-sm">
        Sign-in is not configured yet. Please check back soon.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          onClick={() => signIn(provider.id, { callbackUrl: "/hikes" })}
        >
          Continue with {provider.name}
        </Button>
      ))}
    </div>
  );
}

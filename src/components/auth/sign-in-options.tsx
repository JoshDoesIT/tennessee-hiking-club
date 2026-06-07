"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "./provider-icons";
import { useIsNative } from "@/lib/use-is-native";
import { appSignInPath } from "@/lib/auth/app-signin";

type ProviderInfo = { id: string; name: string; type?: string };

/**
 * Lists the configured Auth.js OAuth providers (from `/api/auth/providers`) as
 * "Continue with X" buttons, so only providers whose credentials are set show
 * up. WebAuthn (passkey) is excluded here; it has its own button and a separate
 * sign-in flow (`next-auth/webauthn`). Each starts the OAuth flow and returns to
 * the hikes page.
 */
export function SignInOptions() {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);
  const native = useIsNative();

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

  const oauthProviders = providers.filter((p) => p.type !== "webauthn");

  if (oauthProviders.length === 0) {
    return (
      <p className="text-ink/70 text-sm">
        Sign-in is not configured yet. Please check back soon.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {oauthProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          onClick={() => {
            // The native app starts OAuth via a full-page navigation so the
            // PKCE / state cookies are set on a navigation the WebView keeps
            // (a fetch-set cookie is not shared with the next navigation in the
            // iOS WebView, #264). The website keeps the standard fetch flow.
            if (native) {
              window.location.assign(appSignInPath(provider.id));
            } else {
              void signIn(provider.id, { callbackUrl: "/hikes" });
            }
          }}
        >
          <ProviderIcon provider={provider.id} />
          Continue with {provider.name}
        </Button>
      ))}
    </div>
  );
}

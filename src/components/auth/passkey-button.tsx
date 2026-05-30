"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "./provider-icons";

/**
 * Passkey (WebAuthn) sign-in (#168). One `signIn("passkey")` call both
 * registers (when you are signed in) and authenticates (when you are not): the
 * server's `/webauthn-options` endpoint decides based on your session.
 *
 * `next-auth/webauthn` pulls in `@simplewebauthn/browser`, so it is imported
 * lazily in the click handler to keep that out of the initial bundle. The button
 * is rendered only where the browser supports WebAuthn, so it degrades
 * gracefully elsewhere.
 */
const subscribe = () => () => {};
const isSupported = () =>
  typeof window !== "undefined" &&
  typeof window.PublicKeyCredential === "function";

export function useWebAuthnSupported(): boolean {
  // false during SSR / first paint, the real capability after hydration; no
  // setState-in-effect and no hydration mismatch.
  return useSyncExternalStore(subscribe, isSupported, () => false);
}

type Variant = "primary" | "accent" | "outline" | "ghost";

export function PasskeyButton({
  label = "Sign in with a passkey",
  callbackUrl = "/hikes",
  variant = "outline",
}: {
  label?: string;
  callbackUrl?: string;
  variant?: Variant;
}) {
  const supported = useWebAuthnSupported();
  const [error, setError] = useState("");

  if (!supported) return null;

  async function start() {
    setError("");
    try {
      const { signIn } = await import("next-auth/webauthn");
      await signIn("passkey", { callbackUrl });
    } catch {
      setError("Passkey sign-in could not start. Try another method.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant={variant} onClick={start}>
        <ProviderIcon provider="passkey" />
        {label}
      </Button>
      {error ? (
        <span role="status" aria-live="polite" className="text-ink/70 text-xs">
          {error}
        </span>
      ) : null}
    </div>
  );
}

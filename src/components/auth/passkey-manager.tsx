"use client";

import { PasskeyButton, useWebAuthnSupported } from "./passkey-button";

/**
 * Signed-in passkey registration (#168). Mounted on the account page only for
 * signed-in members; one click registers a passkey for the current account.
 * Renders nothing where WebAuthn is unsupported so it never leaves an empty
 * heading.
 */
export function PasskeyManager() {
  const supported = useWebAuthnSupported();
  if (!supported) return null;

  return (
    <section
      aria-labelledby="passkeys-heading"
      className="border-forest/10 mt-12 border-t pt-8"
    >
      <h2 id="passkeys-heading" className="display text-forest text-2xl">
        Passkeys
      </h2>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        Add a passkey to sign in with your fingerprint, face, or device PIN next
        time. No password or email needed, and it works even if the other
        sign-in options are unavailable.
      </p>
      <div className="mt-4">
        <PasskeyButton
          action="register"
          label="Add a passkey"
          callbackUrl="/hikes"
          variant="outline"
        />
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PasskeyButton, useWebAuthnSupported } from "./passkey-button";

/**
 * Signed-in passkey management (#168). Mounted on the account page for signed-in
 * members. Reflects whether they already have a passkey (so the button reads
 * "Add another passkey" instead of implying none exist) and registers a new one
 * in a click. Renders nothing where WebAuthn is unsupported, so it never leaves
 * an empty heading.
 */
export function PasskeyManager() {
  const supported = useWebAuthnSupported();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/passkeys")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data && typeof data.count === "number") {
          setCount(data.count);
        }
      })
      .catch(() => {
        /* leave the count unknown; the button still offers to add one */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!supported) return null;

  const has = (count ?? 0) > 0;

  return (
    <section aria-labelledby="passkeys-heading">
      <h3 id="passkeys-heading" className="text-forest text-base font-semibold">
        Passkeys
      </h3>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        {has
          ? `You have ${count} passkey${count === 1 ? "" : "s"} set up. Sign in with your fingerprint, face, or device PIN, no password or email needed.`
          : "Add a passkey to sign in with your fingerprint, face, or device PIN next time. No password or email needed, and it works even if the other sign-in options are unavailable."}
      </p>
      <div className="mt-4">
        <PasskeyButton
          action="register"
          label={has ? "Add another passkey" : "Add a passkey"}
          callbackUrl="/hikes"
          variant="outline"
        />
      </div>
    </section>
  );
}

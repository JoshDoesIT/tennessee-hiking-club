"use client";

import { useState } from "react";
import { appSignOut } from "@/lib/auth/native-signout";
import { Button } from "@/components/ui/button";

/**
 * Permanently delete the signed-in member's account and synced data (#328),
 * behind an explicit confirmation. On success the account's server data is gone
 * and the member is signed out (which also clears the local token on native).
 * Gate this behind a signed-in check where it is mounted.
 */
export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onDelete() {
    setBusy(true);
    setFailed(false);
    const res = await fetch("/api/account", { method: "DELETE" }).catch(
      () => null,
    );
    if (res?.ok) {
      await appSignOut();
      return;
    }
    setBusy(false);
    setFailed(true);
  }

  return (
    <section aria-labelledby="delete-account-heading">
      <h3
        id="delete-account-heading"
        className="text-forest text-base font-semibold"
      >
        Delete account
      </h3>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        Permanently delete your account and the hikes, cleanups, and other data
        synced to it. This cannot be undone. The copy stored on this device
        stays until you clear it from My hikes.
      </p>

      {confirming ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex touch-manipulation items-center rounded-full border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Yes, delete my account"}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setConfirming(true)}
        >
          Delete account
        </Button>
      )}

      {failed ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Something went wrong deleting your account. Please try again.
        </p>
      ) : null}
    </section>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";
import {
  subscribe,
  getPushPrefSnapshot,
  getServerPushPrefSnapshot,
  setPushPref,
  clearPushPref,
} from "@/lib/push/pref";
import {
  registerForPushNotifications,
  unsubscribeDevice,
} from "@/lib/push/register";

/**
 * Opt in or out of trail-alert push notifications (#218, spec 0008). Enabling
 * prompts for permission and registers the device; disabling removes the
 * subscription, which is what stops delivery. On the web (where native push is
 * not available) it points the member to the phone app.
 */
export function PushOptIn() {
  const pref = useSyncExternalStore(
    subscribe,
    getPushPrefSnapshot,
    getServerPushPrefSnapshot,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (pref.optedIn) {
        if (pref.token) await unsubscribeDevice(pref.token);
        clearPushPref();
        setMessage("Trail alerts turned off.");
        return;
      }
      const result = await registerForPushNotifications();
      if (result.status === "registered" && result.token) {
        setPushPref({ optedIn: true, token: result.token });
        setMessage("You’ll get a push when a trail near you has a closure or alert.");
      } else if (!result.supported) {
        setMessage(
          "Push alerts need the Tennessee Hiking Club app on your phone. Open it there to turn them on.",
        );
      } else if (result.status === "denied") {
        setMessage(
          "Notifications are blocked. Allow them for Tennessee Hiking Club in your device settings, then try again.",
        );
      } else {
        setMessage("Couldn’t turn on alerts just now. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="push-opt-in-heading">
      <h3 id="push-opt-in-heading" className="font-display text-forest text-lg">
        Trail alerts
      </h3>
      <div className="mt-2 flex items-start justify-between gap-4">
        <p className="text-pine max-w-prose text-sm">
          Get a push notification when a trail has a new closure, caution, or
          condition report. You can turn this off anytime.
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={pref.optedIn}
          aria-label="Trail alert notifications"
          disabled={busy}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            pref.optedIn ? "bg-forest" : "bg-forest/25"
          } disabled:opacity-60`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-cream shadow transition-transform ${
              pref.optedIn ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {message ? (
        <p className="text-pine mt-2 text-sm" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}

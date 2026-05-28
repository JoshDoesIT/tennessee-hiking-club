"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  subscribe,
  getPledgeSnapshot,
  getServerPledgeSnapshot,
  takePledge,
  clearPledge,
} from "@/lib/stewardship/pledge";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

/** The Leave No Trace pledge: a local, revocable commitment that earns the
 *  Trail Steward badge. SSR-safe via useSyncExternalStore. */
export function StewardPledge() {
  const pledge = useSyncExternalStore(
    subscribe,
    getPledgeSnapshot,
    getServerPledgeSnapshot,
  );

  if (pledge) {
    return (
      <div className="border-amber/40 bg-amber/10 rounded-2xl border p-5">
        <p className="text-forest font-semibold">
          You&rsquo;re a Trail Steward.
        </p>
        <p className="text-ink/70 mt-1 text-sm">
          Pledged on {formatDate(pledge.pledgedOn)}. Thank you for caring for
          Tennessee&rsquo;s trails.
        </p>
        <button
          type="button"
          onClick={() => clearPledge()}
          className="text-olive hover:text-forest mt-3 text-sm underline underline-offset-4"
        >
          Withdraw pledge
        </button>
      </div>
    );
  }

  return (
    <div className="border-forest/15 rounded-2xl border border-dashed p-5">
      <p className="text-ink/80 leading-relaxed">
        Take the pledge to hike responsibly and follow Leave No Trace. It earns
        you the Trail Steward badge, kept on your device.
      </p>
      <Button
        className="mt-4"
        onClick={() => takePledge(new Date().toISOString().slice(0, 10))}
      >
        Take the pledge
      </Button>
    </div>
  );
}

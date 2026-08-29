"use client";

import { useEffect, useState } from "react";
import { LeaderboardOptIn } from "./leaderboard-optin";
import { FriendsManager } from "./friends-manager";
import { ShareMyTennessee } from "./share-my-tennessee";

/**
 * The social tier of the My hikes page: the community leaderboard opt-in,
 * friends, and share-your-map, gathered under one "Friends & sharing" heading so
 * they read as a group instead of three competing sections. The leaderboard and
 * friends need an account, so for signed-out visitors the group heading is
 * skipped and only the share control (which self-gates on having logged hikes)
 * may appear.
 */
export function FriendsAndSharing({ origin }: { origin: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await (await fetch("/api/auth/session")).json();
        if (active) setSignedIn(Boolean(session?.user));
      } catch {
        if (active) setSignedIn(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!signedIn) {
    return <ShareMyTennessee origin={origin} />;
  }

  return (
    <section
      aria-labelledby="social-heading"
      className="border-forest/10 mt-12 border-t pt-8"
    >
      <h2 id="social-heading" className="display text-forest text-2xl">
        Friends &amp; sharing
      </h2>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        Opt in to the community leaderboard, connect with friends, and share
        your map. All off by default.
      </p>
      <div className="mt-6 space-y-8">
        <LeaderboardOptIn />
        <FriendsManager />
        <ShareMyTennessee origin={origin} />
      </div>
    </section>
  );
}

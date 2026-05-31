"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

/**
 * Opt-in control for the community leaderboard. Loads the signed-in user's
 * profile from `/api/profile`; renders nothing when signed out. Sharing is
 * explicit and revocable: the leaderboard only shows users who turn this on.
 */
export function LeaderboardOptIn() {
  const [state, setState] = useState<"loading" | "anon" | "ready">("loading");
  const [isPublic, setIsPublic] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Gate the profile fetch on the session, otherwise /api/profile would
        // 401 for signed-out visitors and the browser would log a network
        // error in DevTools even though the UI handles it.
        const session = await (await fetch("/api/auth/session")).json();
        if (!session?.user) {
          if (active) setState("anon");
          return;
        }
        const r = await fetch("/api/profile");
        if (!r.ok) {
          if (active) setState("anon");
          return;
        }
        const data = await r.json();
        if (active) {
          setIsPublic(Boolean(data.isPublic));
          setDisplayName(data.displayName ?? "");
          setState("ready");
        }
      } catch {
        if (active) setState("anon");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state !== "ready") return null;

  async function save() {
    setStatus("Saving…");
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic, displayName }),
      });
      setStatus(r.ok ? "Saved." : "Could not save.");
    } catch {
      setStatus("Could not save.");
    }
  }

  return (
    <section
      aria-labelledby="leaderboard-optin-heading"
      className="border-forest/10 mt-12 border-t pt-8"
    >
      <h2
        id="leaderboard-optin-heading"
        className="display text-forest text-2xl"
      >
        Community leaderboard
      </h2>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        Off by default. Turn it on to appear on the{" "}
        <a
          href="/leaderboard"
          className="text-pine hover:text-forest underline underline-offset-4"
        >
          leaderboard
        </a>
        , ranked by exploration (Grand Divisions, distinct trails, challenges)
        rather than miles. You can turn it off anytime.
      </p>

      <label className="text-forest mt-4 flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setIsPublic(e.target.checked)
          }
          className="accent-forest h-4 w-4"
        />
        Show me on the leaderboard
      </label>

      <div className="mt-3 flex flex-col gap-1">
        <label
          htmlFor="leaderboard-display-name"
          className="text-olive text-xs font-semibold tracking-wider uppercase"
        >
          Display name
        </label>
        <input
          id="leaderboard-display-name"
          type="text"
          value={displayName}
          maxLength={50}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDisplayName(e.target.value)
          }
          placeholder="How you appear on the board"
          className="border-forest/20 text-ink max-w-xs rounded-lg border bg-cream-50 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={save}>
          Save
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </div>
    </section>
  );
}

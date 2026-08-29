"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

/**
 * Friend management (#147): your shareable friend code, sending requests by
 * code, responding to incoming requests, and your friends list. Renders nothing
 * for signed-out visitors (gated on `/api/auth/session`). Friendship is mutual:
 * a request must be accepted before either of you appears on the other's friends
 * leaderboard.
 */
type Person = { userId: string; displayName: string | null };
type FriendsData = {
  code: string;
  friends: Array<Person & { friendshipId: string }>;
  incoming: Array<Person & { id: string }>;
  outgoing: Array<Person & { id: string }>;
};

const REASONS: Record<string, string> = {
  self: "That is your own code.",
  "not-found": "No member has that code.",
  "already-requested": "You already sent them a request.",
  "already-friends": "You are already friends.",
  "respond-to-theirs": "They already sent you a request, respond below.",
};

export function FriendsManager() {
  const [state, setState] = useState<"loading" | "anon" | "ready">("loading");
  const [data, setData] = useState<FriendsData | null>(null);
  const [status, setStatus] = useState("");
  // The viewer's own profile, so a display-name change preserves their public
  // opt-in (#164) rather than silently turning it off.
  const [isPublic, setIsPublic] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameStatus, setNameStatus] = useState("");

  async function load() {
    const res = await fetch("/api/friends");
    if (res.ok) setData((await res.json()) as FriendsData);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await (await fetch("/api/auth/session")).json();
        if (!session?.user) {
          if (active) setState("anon");
          return;
        }
        const [, profileRes] = await Promise.all([
          load(),
          fetch("/api/profile"),
        ]);
        if (profileRes.ok && active) {
          const p = (await profileRes.json()) as {
            isPublic?: boolean;
            displayName?: string;
          };
          setIsPublic(Boolean(p.isPublic));
          setDisplayName(p.displayName ?? "");
        }
        if (active) setState("ready");
      } catch {
        if (active) setState("anon");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state !== "ready" || !data) return null;

  async function saveName() {
    setNameStatus("Saving…");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic, displayName: displayName.trim() }),
      });
      setNameStatus(res.ok ? "Saved." : "Could not save.");
    } catch {
      setNameStatus("Could not save.");
    }
  }

  async function addFriend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = String(new FormData(form).get("code") ?? "").trim();
    if (!code) return;
    setStatus("Sending…");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await res.json().catch(() => null);
      if (result?.ok) {
        setStatus("Request sent.");
        form.reset();
        await load();
      } else {
        setStatus(REASONS[result?.reason] ?? "Could not send the request.");
      }
    } catch {
      setStatus("Could not send the request.");
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    await fetch(`/api/friends/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    await load();
  }

  const name = (p: Person, fallback: string) => p.displayName || fallback;

  return (
    <section aria-labelledby="friends-heading">
      <h3 id="friends-heading" className="text-forest text-base font-semibold">
        Friends
      </h3>
      <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
        Compare boards with people you hike with. Share your code, add a friend
        by theirs, and once you both accept you appear on each other&rsquo;s{" "}
        <a
          href="/leaderboard?scope=friends"
          className="text-pine hover:text-forest underline underline-offset-4"
        >
          Friends leaderboard
        </a>{" "}
        — even if you keep the public board off.
      </p>

      <div className="text-forest mt-4 text-sm">
        Your friend code:{" "}
        <code className="bg-forest/5 rounded px-2 py-1 font-mono tracking-wider">
          {data.code}
        </code>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="friend-display-name"
            className="text-olive text-xs font-semibold tracking-wider uppercase"
          >
            Display name
          </label>
          <input
            id="friend-display-name"
            value={displayName}
            maxLength={50}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How friends see you"
            className="border-forest/20 text-ink bg-cream-50 rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={saveName}>
          Save name
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {nameStatus}
        </span>
      </div>
      <p className="text-ink/70 mt-1 text-xs">
        Shown to friends. Setting it does not turn on the public leaderboard.
      </p>

      <form
        onSubmit={addFriend}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <div className="flex flex-col gap-1">
          <label
            htmlFor="friend-code"
            className="text-olive text-xs font-semibold tracking-wider uppercase"
          >
            Add a friend by code
          </label>
          <input
            id="friend-code"
            name="code"
            maxLength={16}
            placeholder="Their friend code"
            className="border-forest/20 text-ink bg-cream-50 rounded-lg border px-3 py-2 text-sm uppercase"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Add friend
        </Button>
        <span role="status" aria-live="polite" className="text-pine text-sm">
          {status}
        </span>
      </form>

      {data.incoming.length > 0 && (
        <div className="mt-6">
          <h4 className="text-olive text-xs font-semibold tracking-wider uppercase">
            Requests
          </h4>
          <ul className="mt-2 space-y-2">
            {data.incoming.map((r) => (
              <li key={r.id} className="flex items-center gap-3 text-sm">
                <span className="text-forest flex-1 font-medium">
                  {name(r, "A hiker")}
                </span>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => respond(r.id, "accept")}
                >
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => respond(r.id, "decline")}
                >
                  Decline
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h4 className="text-olive text-xs font-semibold tracking-wider uppercase">
          Your friends
        </h4>
        {data.friends.length === 0 ? (
          <p className="text-ink/70 mt-2 text-sm">No friends yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.friends.map((f) => (
              <li
                key={f.friendshipId}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-forest flex-1 font-medium">
                  {name(f, "A friend")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Remove ${name(f, "friend")}`}
                  onClick={() => remove(f.friendshipId)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.outgoing.length > 0 && (
        <p className="text-ink/70 mt-4 text-xs">
          Pending sent:{" "}
          {data.outgoing.map((o) => name(o, "a hiker")).join(", ")}
        </p>
      )}
    </section>
  );
}

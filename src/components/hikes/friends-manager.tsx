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
        await load();
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
    <section
      aria-labelledby="friends-heading"
      className="border-forest/10 mt-12 border-t pt-8"
    >
      <h2 id="friends-heading" className="display text-forest text-2xl">
        Friends
      </h2>
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

      <form onSubmit={addFriend} className="mt-4 flex flex-wrap items-end gap-2">
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
            className="border-forest/20 text-ink rounded-lg border bg-white px-3 py-2 text-sm uppercase"
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
          <h3 className="text-olive text-xs font-semibold tracking-wider uppercase">
            Requests
          </h3>
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
        <h3 className="text-olive text-xs font-semibold tracking-wider uppercase">
          Your friends
        </h3>
        {data.friends.length === 0 ? (
          <p className="text-ink/70 mt-2 text-sm">No friends yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.friends.map((f) => (
              <li key={f.friendshipId} className="flex items-center gap-3 text-sm">
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
          Pending sent: {data.outgoing.map((o) => name(o, "a hiker")).join(", ")}
        </p>
      )}
    </section>
  );
}

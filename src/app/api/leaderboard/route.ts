import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  loadPublicEntries,
  loadFriendEntries,
} from "@/lib/hikes/leaderboard-server";
import type { LeaderboardWindow } from "@/lib/hikes/leaderboard";

/**
 * The leaderboard data for the (now static) page, fetched client-side (#308).
 * Returns the per-user entries for a scope + window; the client ranks them by
 * the selected metric. The friends board needs a signed-in member; when signed
 * out it returns `needsSignIn` so the page can prompt instead of erroring.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const window: LeaderboardWindow =
    params.get("window") === "year" ? "year" : "all";
  const scope = params.get("scope") === "friends" ? "friends" : "public";

  if (scope === "friends") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ entries: [], needsSignIn: true });
    }
    return NextResponse.json({
      entries: await loadFriendEntries(session.user.id, window),
    });
  }

  return NextResponse.json({ entries: await loadPublicEntries(window) });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getContributionCountForUser } from "@/lib/stewardship/contributions-server";

/**
 * The signed-in member's recognized contribution count, for the Trail Steward
 * badge on the now-static account page (#308). Returns 0 when signed out, so the
 * client can read a plain `{ count }` without handling an auth error; offline
 * the fetch fails and the badge falls back to the local pledge.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const count = userId ? await getContributionCountForUser(userId) : 0;
  return NextResponse.json({ count });
}

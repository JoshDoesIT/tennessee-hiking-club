import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFriendsData, sendFriendRequest } from "@/lib/friends/friends-server";

/** The signed-in user's friends, incoming/outgoing requests, and friend code. */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(await getFriendsData(userId));
}

const bodySchema = z.object({ code: z.string().trim().min(1) });

/** Send a friend request to the member with the given friend code. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let code: string;
  try {
    code = bodySchema.parse(await req.json()).code;
  } catch {
    return NextResponse.json({ error: "A friend code is required" }, { status: 400 });
  }

  return NextResponse.json(await sendFriendRequest(userId, code));
}

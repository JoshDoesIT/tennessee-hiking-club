import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { respondToRequest } from "@/lib/friends/friends-server";

type Context = { params: Promise<{ id: string }> };

/** Accept or decline an incoming friend request (addressee only). */
export async function POST(req: Request, { params }: Context) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let action: unknown;
  try {
    action = (await req.json())?.action;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { id } = await params;
  const result = await respondToRequest(userId, id, action);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

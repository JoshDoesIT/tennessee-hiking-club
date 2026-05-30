import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { removeFriendship } from "@/lib/friends/friends-server";

type Context = { params: Promise<{ id: string }> };

/** Remove a friendship or cancel a pending request (either party). */
export async function DELETE(_req: Request, { params }: Context) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const result = await removeFriendship(userId, id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

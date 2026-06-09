import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { deleteAccount } from "@/lib/account/delete-account";

/**
 * Delete the signed-in member's account and everything synced for them (#328).
 * Auth-gated. Deleting the user cascades the Auth.js session rows, so the
 * session is invalidated server-side; the client then signs out.
 */
export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  await deleteAccount(getDb(), userId);
  return NextResponse.json({ ok: true });
}

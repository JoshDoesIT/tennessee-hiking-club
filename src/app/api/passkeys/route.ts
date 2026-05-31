import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { countUserPasskeys } from "@/lib/auth/passkeys-server";

/** The signed-in member's registered passkey count, so the account page can
 *  reflect whether they already have one (#168). */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const count = await countUserPasskeys(getDb(), userId);
  return NextResponse.json({ count });
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

/** The current signed-in user (or null), for the client-side auth control. */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

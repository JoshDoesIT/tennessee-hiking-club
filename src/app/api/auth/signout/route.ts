import { NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/auth/session";
import { revokeToken } from "@/lib/auth/oauth";

/** Revoke the access token (best effort) and clear the session cookie. */
export async function POST() {
  const session = await getSession();
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;

  if (session && clientId && clientSecret) {
    try {
      await revokeToken(session.accessToken, { clientId, clientSecret });
    } catch {
      // Revocation is best effort; clearing the cookie still signs the user out.
    }
  }

  await clearSession();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  consumeAuthCode,
  createSession,
  sessionCookie,
} from "@/lib/auth/native-auth";

/**
 * Exchanges a one-time native sign-in code (minted in the system browser after
 * OAuth) for a real session (#276). Called by the WebView with `fetch`, so the
 * Set-Cookie applies to the WebView's own cookie store, which is what made the
 * cookie-based OAuth flow fail to stick.
 */
export async function POST(request: Request) {
  let code: unknown;
  try {
    code = (await request.json())?.code;
  } catch {
    code = undefined;
  }
  if (typeof code !== "string" || !code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  const db = getDb();
  const userId = await consumeAuthCode(db, code);
  if (!userId) {
    return NextResponse.json({ error: "invalid code" }, { status: 401 });
  }

  const sessionToken = await createSession(db, userId);
  const cookie = sessionCookie(sessionToken);
  // The cookie serves the web / server.url build; `sessionToken` is also returned
  // so the local bundle can store it and send it as a bearer header, where the
  // cross-origin cookie does not flow (phase 4).
  const res = NextResponse.json({ ok: true, sessionToken });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

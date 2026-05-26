import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/auth/oauth";

function randomString(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Start the OAuth flow: stash PKCE/state/nonce, redirect to Vercel. */
export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Sign-in is not configured." },
      { status: 503 },
    );
  }

  const state = randomString(32);
  const nonce = randomString(32);
  const codeVerifier = randomString(48);
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const store = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  store.set("oauth_state", state, opts);
  store.set("oauth_nonce", nonce, opts);
  store.set("oauth_code_verifier", codeVerifier, opts);

  return NextResponse.redirect(
    buildAuthorizeUrl({
      clientId,
      redirectUri: `${req.nextUrl.origin}/api/auth/callback`,
      state,
      nonce,
      codeChallenge,
    }),
  );
}

import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  nonceFromIdToken,
} from "@/lib/auth/oauth";
import { setSession } from "@/lib/auth/session";

/** Finish the OAuth flow: validate, exchange the code, set the session. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const storedState = store.get("oauth_state")?.value;
  const storedNonce = store.get("oauth_nonce")?.value;
  const codeVerifier = store.get("oauth_code_verifier")?.value;

  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;

  const fail = () => NextResponse.redirect(new URL("/hikes?auth=error", req.url));

  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState ||
    !codeVerifier ||
    !clientId ||
    !clientSecret
  ) {
    return fail();
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier,
      redirectUri: `${url.origin}/api/auth/callback`,
      clientId,
      clientSecret,
    });

    if (storedNonce && nonceFromIdToken(tokens.id_token) !== storedNonce) {
      return fail();
    }

    const user = await fetchUserInfo(tokens.access_token);
    if (!user) return fail();

    await setSession({
      sub: user.sub,
      name: user.name,
      email: user.email,
      picture: user.picture,
      accessToken: tokens.access_token,
    });
  } catch {
    return fail();
  }

  for (const key of ["oauth_state", "oauth_nonce", "oauth_code_verifier"]) {
    store.set(key, "", { maxAge: 0, path: "/" });
  }
  return NextResponse.redirect(new URL("/hikes?auth=success", req.url));
}

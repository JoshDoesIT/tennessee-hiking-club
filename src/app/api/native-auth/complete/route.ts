import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { mintAuthCode } from "@/lib/auth/native-auth";

/**
 * The callback the native sign-in targets after OAuth completes in the system
 * browser (#276). At this point the browser holds the session, so `auth()`
 * resolves the user; we mint a one-time code and hand it to the app via a custom
 * scheme deep link, which the app exchanges for its own session cookie.
 */
const APP_SCHEME = "tnhc";

function deepLink(query: string) {
  // A custom scheme bypasses NextResponse.redirect's http(s) URL validation.
  return new Response(null, {
    status: 307,
    headers: { Location: `${APP_SCHEME}://auth?${query}` },
  });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return deepLink("error=unauthenticated");
  const code = await mintAuthCode(getDb(), userId);
  return deepLink(`code=${encodeURIComponent(code)}`);
}

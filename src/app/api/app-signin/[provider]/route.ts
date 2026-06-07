import { NextResponse } from "next/server";
import { signIn } from "@/auth";

/**
 * Starts an OAuth sign-in as a full-page navigation for the native app (#264).
 *
 * `next-auth/react`'s `signIn` begins the flow with a background `fetch`, and the
 * iOS WebView does not share a cookie set on a fetch response with the page
 * navigation that follows, so the PKCE / state check cookies were missing at the
 * callback. The server `signIn` (CSRF is skipped for the server initiator) sets
 * those cookies via `cookies()`, which attach to this redirect, so they are set
 * on a navigation the WebView keeps. PKCE and state stay enabled, so the callback
 * still verifies them; the website is unaffected and keeps using the fetch flow.
 */
const ALLOWED_PROVIDERS = new Set(["github", "google", "facebook"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  // Where to land after sign-in. Native sign-in targets the native completion
  // route; default to /hikes. Only same-site relative paths are allowed (no
  // "//host" protocol-relative open redirects).
  const to = new URL(request.url).searchParams.get("to");
  const redirectTo =
    to && to.startsWith("/") && !to.startsWith("//") ? to : "/hikes";
  try {
    const url = await signIn(provider, { redirect: false, redirectTo });
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[app-signin] failed to start the OAuth flow", error);
    return NextResponse.redirect(new URL("/signin?error=oauth", request.url));
  }
}
